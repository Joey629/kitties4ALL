#!/usr/bin/env python3
"""Generate a painterly shelter room background matching cat illustration style."""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1200
OUT = Path(__file__).resolve().parents[1] / 'public' / 'shelter' / 'room-bg.png'


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def mix_color(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


def add_paper_texture(img: Image.Image, strength: float = 0.06) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    noise = np.random.default_rng(42).normal(0, 1, (H, W))
    for c in range(3):
        arr[:, :, c] += noise * 255 * strength
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = mix_color(top, bottom, t)
        arr[y, :, :] = color
    return Image.fromarray(arr)


def draw_window_light(base: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    # Window frame — warm painted wood
    frame = (210, 178, 138)
    frame_dark = (170, 138, 102)
    glass_top = (255, 246, 224)
    glass_bottom = (255, 228, 186)

    x0, y0, x1, y1 = 110, 120, 430, 430
    draw.rounded_rectangle((x0 - 18, y0 - 18, x1 + 18, y1 + 82), radius=18, fill=frame)
    draw.rounded_rectangle((x0 - 8, y0 - 8, x1 + 8, y1 + 72), radius=12, fill=frame_dark)

    for gy in range(y0, y1, 4):
        t = (gy - y0) / (y1 - y0)
        color = mix_color(glass_top, glass_bottom, t * 0.65)
        draw.rectangle((x0, gy, x1, gy + 3), fill=color)

    draw.rectangle((x0, y0, x1, y1), fill=glass_top)
    draw.rectangle((x0, y0, x1, y1), outline=frame_dark, width=3)
    draw.line((x0 + (x1 - x0) // 2, y0, x0 + (x1 - x0) // 2, y1), fill=frame_dark, width=4)
    draw.line((x0, y0 + (y1 - y0) // 2, x1, y0 + (y1 - y0) // 2), fill=frame_dark, width=4)

    # Sun wash across floor
    wash = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(wash)
    wdraw.polygon(
        [(x0, y1), (x0 + 120, y1), (W * 0.72, H), (W * 0.18, H)],
        fill=(255, 232, 188, 95),
    )
    wdraw.ellipse((x0 - 40, y0 - 20, x1 + 120, y1 + 80), fill=(255, 244, 220, 70))
    base.alpha_composite(wash)


def draw_floor(base: Image.Image, draw: ImageDraw.ImageDraw, floor_y: int) -> None:
    floor = vertical_gradient((W, H - floor_y), (214, 188, 152), (176, 146, 112))
    base.paste(floor, (0, floor_y))

    plank = Image.new('RGBA', (W, H - floor_y), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(plank)
    for i in range(14):
        x = i * 145 - 40
        shade = 18 + (i % 3) * 8
        pdraw.line([(x, 0), (x - 90, H - floor_y)], fill=(120, 92, 64, shade), width=5)
    plank = plank.filter(ImageFilter.GaussianBlur(1.2))
    base.alpha_composite(plank, (0, floor_y))

    draw.rectangle((0, floor_y - 10, W, floor_y + 4), fill=(160, 128, 92))


def draw_rug(base: Image.Image, draw: ImageDraw.ImageDraw, cx: int, cy: int) -> None:
    rug = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rug)
    for i, (rx, ry, color, alpha) in enumerate(
        [
            (430, 130, (168, 196, 186), 150),
            (390, 110, (146, 176, 164), 120),
            (300, 90, (188, 210, 200), 90),
        ]
    ):
        rdraw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(*color, alpha))
    rug = rug.filter(ImageFilter.GaussianBlur(3))
    base.alpha_composite(rug)


def draw_cat_tree(base: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x, y = 220, 700
    draw.rounded_rectangle((x, y, x + 46, y + 250), radius=16, fill=(186, 154, 118))
    draw.rounded_rectangle((x + 8, y + 8, x + 38, y + 240), radius=12, fill=(166, 136, 100))
    for i in range(7):
        yy = y + 28 + i * 28
        draw.ellipse((x - 36, yy - 10, x + 82, yy + 10), fill=(236, 220, 196))
    draw.ellipse((x - 70, y - 28, x + 116, y + 8), fill=(226, 210, 186))
    draw.ellipse((x + 92, y + 18, x + 118, y + 44), fill=(214, 108, 88))


def draw_cozy_bed(base: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x, y = 560, 860
    draw.ellipse((x, y + 20, x + 280, y + 110), fill=(176, 146, 112))
    draw.ellipse((x + 20, y, x + 260, y + 80), fill=(244, 210, 186))
    draw.arc((x + 40, y - 30, x + 240, y + 40), start=200, end=340, fill=(196, 168, 214), width=18)


def draw_blanket_fort(base: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x, y = 1380, 820
    draw.rectangle((x, y, x + 18, y + 150), fill=(132, 102, 74))
    draw.pieslice((x, y - 10, x + 280, y + 150), start=180, end=360, fill=(232, 176, 132))
    draw.pieslice((x + 20, y + 10, x + 250, y + 120), start=190, end=350, fill=(244, 196, 160))


def draw_food_station(base: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x, y = 430, 930
    draw.ellipse((x, y, x + 90, y + 34), fill=(168, 204, 220))
    draw.ellipse((x + 12, y + 4, x + 78, y + 24), fill=(214, 120, 96))
    draw.ellipse((x + 120, y, x + 196, y + 34), fill=(168, 204, 220))
    draw.ellipse((x + 132, y + 4, x + 184, y + 24), fill=(156, 188, 162))


def draw_plants(base: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    spots = [(90, 700), (1760, 680), (1180, 760)]
    for x, y in spots:
        draw.rounded_rectangle((x + 18, y + 50, x + 52, y + 100), radius=8, fill=(166, 136, 100))
        draw.ellipse((x, y, x + 70, y + 70), fill=(142, 176, 148))
        draw.ellipse((x + 24, y - 8, x + 78, y + 36), fill=(118, 154, 126))


def draw_medical_nook(draw: ImageDraw.ImageDraw) -> None:
    x, y = 1540, 560
    draw.rounded_rectangle((x, y, x + 250, y + 56), radius=28, fill=(214, 198, 232))
    # text rendered in SVG overlay instead


def generate() -> Path:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    wall_top = (250, 238, 220)
    wall_bottom = (238, 224, 204)
    base = vertical_gradient((W, H), wall_top, wall_bottom).convert('RGBA')
    base = add_paper_texture(base.convert('RGB')).convert('RGBA')

    draw = ImageDraw.Draw(base)
    floor_y = int(H * 0.62)
    draw_floor(base, draw, floor_y)
    draw_window_light(base, draw)
    draw_rug(base, draw, int(W * 0.5), int(H * 0.82))
    draw_cat_tree(base, draw)
    draw_cozy_bed(base, draw)
    draw_blanket_fort(base, draw)
    draw_food_station(base, draw)
    draw_plants(base, draw)
    draw_medical_nook(draw)

    # Soft vignette
    vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    vdraw.ellipse((-220, -120, W + 220, H + 180), fill=(92, 68, 44, 28))
    vignette = vignette.filter(ImageFilter.GaussianBlur(80))
    base.alpha_composite(vignette)

    final = base.convert('RGB')
    final.save(OUT, format='PNG', optimize=True)
    print(f'Wrote {OUT} ({W}x{H})')
    return OUT


if __name__ == '__main__':
    generate()
