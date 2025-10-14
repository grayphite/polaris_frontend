export const PROJECT_DETAILS_PREFIX = 'projectDetails:';

export function getProjectDetails(projectId: string): string {
  try {
    return window.localStorage.getItem(PROJECT_DETAILS_PREFIX + projectId) || '';
  } catch {
    return '';
  }
}

export function setProjectDetails(projectId: string, details: string): void {
  try {
    window.localStorage.setItem(PROJECT_DETAILS_PREFIX + projectId, details);
  } catch {}
}

export function removeProjectDetails(projectId: string): void {
  try {
    window.localStorage.removeItem(PROJECT_DETAILS_PREFIX + projectId);
  } catch {}
}

export function seedProjectDetails(seed: Record<string, string>): void {
  Object.entries(seed).forEach(([id, details]) => {
    try {
      const key = PROJECT_DETAILS_PREFIX + id;
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, details);
      }
    } catch {}
  });
}


