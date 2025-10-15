import { makeRequest } from './api';

export type ProjectDTO = {
  id: string;
  name: string;
  details?: string;
  chats?: Array<{ id: string; title: string; details?: string }>; // optional embedded chats
};

export async function fetchProjects(): Promise<ProjectDTO[]> {
  return makeRequest<ProjectDTO[]>('/projects', { method: 'GET' });
}

export async function fetchProjectById(id: string): Promise<ProjectDTO> {
  return makeRequest<ProjectDTO>(`/projects/${id}`, { method: 'GET' });
}

export async function createProjectApi(name: string, details: string): Promise<ProjectDTO> {
  return makeRequest<ProjectDTO>('/project', { method: 'POST', data: { name, details } });
}

export async function updateProjectApi(id: string, name: string, details: string): Promise<ProjectDTO> {
  return makeRequest<ProjectDTO>('/project', { method: 'PUT', data: { id, name, details } });
}

export async function deleteProjectApi(id: string): Promise<{ success: boolean }>{
  return makeRequest<{ success: boolean }>(`/project/${id}`, { method: 'DELETE' });
}


