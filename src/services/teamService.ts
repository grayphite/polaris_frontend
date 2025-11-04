import { makeRequest } from './api';

export type TeamDTO = {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  created_by: number;
  deleted_at?: string | null;
  deleted_by?: number | null;
  is_deleted: boolean;
  member_count?: number;
};

export type TeamsResponse = {
  success: boolean;
  teams: TeamDTO[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export async function createTeam(payload: {
  name: string;
  description?: string;
}): Promise<TeamDTO> {
  return makeRequest<TeamDTO>('/teams', {
    method: 'POST',
    data: payload,
  });
}

export async function listTeams(
  params: {
    page?: number;
    per_page?: number;
    search?: string;
    teamsFilter?: 'own-teams' | 'enrolled-teams';
  } = {}
): Promise<TeamsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.per_page) searchParams.set('per_page', String(params.per_page));
  if (params.search) searchParams.set('search', params.search);
  if (params.teamsFilter) searchParams.set('teams-filter', params.teamsFilter);
  const query = searchParams.toString();
  return makeRequest<TeamsResponse>(`/teams${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function createTeamInvitation(
  teamId: number,
  payload: { invited_email: string }
): Promise<{ success?: boolean } | void> {
  return makeRequest('/teams/' + teamId + '/invitations', {
    method: 'POST',
    data: payload,
  });
}

export type TeamMemberDTO = {
  id: number;
  team_id: number;
  user_id: number;
  role: string;
  permissions: any;
  joined_at: string;
  updated_at: string;
  left_at: string | null;
  added_by: number | null;
  removed_by: number | null;
  is_deleted: boolean;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
  };
};

export type TeamMembersResponse = {
  success: boolean;
  members: TeamMemberDTO[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export async function listTeamMembers(teamId: string): Promise<TeamMembersResponse> {
  return makeRequest<TeamMembersResponse>(`/teams/${teamId}/members`, { method: 'GET' });
}

