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


