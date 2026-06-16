import type { LifestyleAnswers } from '@/shared/adoptionMatch';

const STORAGE_KEY = 'kitticare-adopter-lifestyle';

export function loadLifestyleAnswers(): LifestyleAnswers | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LifestyleAnswers;
  } catch {
    return null;
  }
}

export function saveLifestyleAnswers(answers: LifestyleAnswers) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

export function clearLifestyleAnswers() {
  sessionStorage.removeItem(STORAGE_KEY);
}
