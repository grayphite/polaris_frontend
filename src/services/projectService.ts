import { makeRequest } from './api';

export type ProjectDTO = {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  created_by: number;
  is_deleted: boolean;
  chat_count?: number;
  chats?: Array<{ id: string; title: string; details?: string }>; // optional embedded chats
};

export type ProjectsResponse = {
  success: boolean;
  projects: ProjectDTO[];
  pagination: {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    per_page: number;
    total: number;
  };
};

export async function fetchProjects(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  includeDeleted: boolean = false,
  teamId?: string | null
): Promise<ProjectsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    search: search,
    include_deleted: includeDeleted.toString()
  });
  
  if (teamId) {
    params.set('team_id', teamId);
  }
  
  return makeRequest<ProjectsResponse>(`/projects?${params}`, { method: 'GET' });
}

export async function fetchProjectById(id: string): Promise<ProjectDTO> {
  return makeRequest<ProjectDTO>(`/projects/${id}`, { method: 'GET' });
}

export async function createProjectApi(name: string, description?: string): Promise<ProjectDTO> {
  return makeRequest<ProjectDTO>('/projects', { method: 'POST', data: { name, description } });
}

export async function updateProjectApi(id: string, name: string, description?: string): Promise<ProjectDTO> {
  return makeRequest<ProjectDTO>(`/projects/${id}`, { method: 'PUT', data: { name, description } });
}

export async function deleteProjectApi(id: string): Promise<{ success: boolean }>{
  return makeRequest<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' });
}


