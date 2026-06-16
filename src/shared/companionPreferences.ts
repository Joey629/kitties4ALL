import type { WorkRole } from '@/companion/types';

const ROLE_KEY = 'kitticare-companion-work-role';

export function loadCompanionWorkRole(defaultRole: WorkRole = 'volunteer'): WorkRole {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    if (raw === 'volunteer' || raw === 'foster_parent') return raw;
  } catch {
    /* ignore */
  }
  return defaultRole;
}

export function saveCompanionWorkRole(role: WorkRole) {
  localStorage.setItem(ROLE_KEY, role);
}
