import { makeRequest } from './api';

export type ProjectMemberDTO = {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  is_deleted: boolean;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
  };
};

export type ProjectMembersResponse = {
  success: boolean;
  members: ProjectMemberDTO[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export async function listProjectMembers(
  projectId: string,
  page: number = 1,
  perPage: number = 10
): Promise<ProjectMembersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return makeRequest<ProjectMembersResponse>(`/projects/${projectId}/members?${params}`, { method: 'GET' });
}

export async function addProjectMember(
  projectId: string,
  userId: number,
  role: string
): Promise<ProjectMemberDTO> {
  return makeRequest<ProjectMemberDTO>(`/projects/${projectId}/members`, {
    method: 'POST',
    data: { user_id: userId, role },
  });
}

export async function removeProjectMember(
  projectId: string,
  memberUserId: number
): Promise<{ message: string }> {
  return makeRequest<{ message: string }>(`/projects/${projectId}/members/${memberUserId}`, {
    method: 'DELETE',
  });
}

export async function updateProjectMemberRole(
  projectId: string,
  memberUserId: number,
  role: string
): Promise<ProjectMemberDTO> {
  return makeRequest<ProjectMemberDTO>(`/projects/${projectId}/members/${memberUserId}/role`, {
    method: 'PUT',
    data: { role },
  });
}

