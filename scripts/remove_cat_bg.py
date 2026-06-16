#!/usr/bin/env python3
"""Remove solid backgrounds from cat reference images."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

DEFAULT_TOLERANCE = 24
FEATHER = 2

# Lower tolerance for cream/white cats to avoid chest leaks.
PER_IMAGE_TOLERANCE: dict[str, float] = {
    'luna.png': 18,
    'mochi.png': 20,
    'pearl.png': 20,
    'willow.png': 34,
    'shadow.png': 26,
}

# Strip cast shadows in the bottom strip (dark pixels only).
PER_IMAGE_BOTTOM_SHADOW: dict[str, float] = {
    'willow.png': 0.12,
    'biscuit.png': 0.08,
    'ginger.png': 0.08,
    'maple.png': 0.08,
}


def bg_color_from_edges(arr: np.ndarray) -> np.ndarray:
    h, w, _ = arr.shape
    samples = []
    for x in range(w):
        samples.append(arr[0, x, :3])
        samples.append(arr[h - 1, x, :3])
    for y in range(h):
        samples.append(arr[y, 0, :3])
        samples.append(arr[y, w - 1, :3])
    return np.median(samples, axis=0).astype(np.float32)


def color_dist(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a.astype(np.float32) - b.astype(np.float32)))


def border_connected_background(arr: np.ndarray, bg: np.ndarray, tolerance: float) -> np.ndarray:
    h, w, _ = arr.shape
    is_bg = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if visited[y, x]:
            continue
        visited[y, x] = True
        pixel = arr[y, x, :3]
        if color_dist(pixel, bg) <= tolerance:
            is_bg[y, x] = True
            if x > 0:
                q.append((x - 1, y))
            if x < w - 1:
                q.append((x + 1, y))
            if y > 0:
                q.append((x, y - 1))
            if y < h - 1:
                q.append((x, y + 1))

    return is_bg


def fill_foreground_holes(alpha: np.ndarray, min_opaque_neighbors: int = 5, passes: int = 6) -> np.ndarray:
    h, w = alpha.shape
    result = alpha.copy()
    for _ in range(passes):
        changed = False
        next_alpha = result.copy()
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if result[y, x] >= 16:
                    continue
                neighbors = result[y - 1 : y + 2, x - 1 : x + 2]
                opaque = int(np.sum(neighbors >= 200))
                if opaque >= min_opaque_neighbors:
                    next_alpha[y, x] = 255
                    changed = True
        result = next_alpha
        if not changed:
            break
    return result


def feather_alpha(arr: np.ndarray, is_bg: np.ndarray, bg: np.ndarray, tolerance: float, feather: int) -> np.ndarray:
    h, w, _ = arr.shape
    alpha = arr[:, :, 3].astype(np.float32)

    for _ in range(feather):
        for y in range(h):
            for x in range(w):
                if is_bg[y, x] or alpha[y, x] == 0:
                    continue
                neighbors = [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
                if any(0 <= nx < w and 0 <= ny < h and (is_bg[ny, nx] or alpha[ny, nx] < 255) for nx, ny in neighbors):
                    dist = color_dist(arr[y, x, :3], bg)
                    if dist <= tolerance * 1.15:
                        fade = max(0.0, 1.0 - (dist / (tolerance * 1.15)))
                        alpha[y, x] = min(alpha[y, x], fade * 255)

    arr[:, :, 3] = alpha.astype(np.uint8)
    return arr


def trim_transparent(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def remove_ground_shadow(arr: np.ndarray, bg: np.ndarray, tolerance: float, bottom_ratio: float = 0.14) -> np.ndarray:
    h, w, _ = arr.shape
    y_start = int(h * (1 - bottom_ratio))
    for y in range(y_start, h):
        for x in range(w):
            if arr[y, x, 3] == 0:
                continue
            if color_dist(arr[y, x, :3], bg) <= tolerance * 1.35:
                arr[y, x, 3] = 0
    return arr


def remove_bottom_shadow(
    arr: np.ndarray,
    bg: np.ndarray,
    bottom_ratio: float,
    *,
    max_luma: int = 215,
    bg_tolerance: float | None = None,
) -> np.ndarray:
    h, w, _ = arr.shape
    y_start = int(h * (1 - bottom_ratio))
    for y in range(y_start, h):
        for x in range(w):
            if arr[y, x, 3] == 0:
                continue
            rgb = arr[y, x, :3]
            r, g, b = rgb.astype(int)
            if bg_tolerance is not None and color_dist(rgb, bg) <= bg_tolerance:
                arr[y, x, 3] = 0
                continue
            if int(r) + int(g) + int(b) < max_luma:
                arr[y, x, 3] = 0
    return arr


def remove_background(input_path: Path, output_path: Path, tolerance: float = DEFAULT_TOLERANCE) -> None:
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img)
    bg = bg_color_from_edges(arr)
    is_bg = border_connected_background(arr, bg, tolerance)

    arr[is_bg, 3] = 0
    alpha = arr[:, :, 3]
    alpha = fill_foreground_holes(alpha)
    arr[:, :, 3] = alpha
    arr = remove_ground_shadow(arr, bg, tolerance)
    bottom_shadow = PER_IMAGE_BOTTOM_SHADOW.get(input_path.name)
    if bottom_shadow:
        arr = remove_bottom_shadow(
            arr,
            bg,
            bottom_shadow,
            bg_tolerance=48 if input_path.name == 'willow.png' else None,
        )
    arr = feather_alpha(arr, is_bg, bg, tolerance, FEATHER)

    result = Image.fromarray(arr)
    result = trim_transparent(result)
    padded = Image.new('RGBA', (result.width + 8, result.height + 8), (0, 0, 0, 0))
    padded.paste(result, (4, 4), result)
    padded.save(output_path, format='PNG', optimize=True)
    print(f'OK {input_path.name} tol={tolerance} -> {output_path.name} ({padded.width}x{padded.height})')


def main() -> int:
    cats_dir = Path(__file__).resolve().parents[1] / 'public' / 'cats'
    source_dir = cats_dir / 'source'

    for backup in sorted(source_dir.glob('*.png')):
        tol = PER_IMAGE_TOLERANCE.get(backup.name, DEFAULT_TOLERANCE)
        remove_background(backup, cats_dir / backup.name, tolerance=tol)

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
