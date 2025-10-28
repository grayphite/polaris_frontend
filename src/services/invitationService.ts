import { makeRequest } from './api';

export type InvitationDTO = {
  id: number;
  team_id: number;
  invited_email: string;
  role?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  invited_at: string;
  expires_at?: string;
  is_expired?: boolean;
  days_until_expiry?: number;
};

export type InvitationsResponse = {
  success: boolean;
  invitations: InvitationDTO[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export async function fetchInvitations(params: {
  page?: number;
  per_page?: number;
  team_id?: number;
  status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
} = {}): Promise<InvitationsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.per_page) searchParams.set('per_page', String(params.per_page));
  if (params.team_id) searchParams.set('team_id', String(params.team_id));
  if (params.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  const endpoint = `/invitations${query ? `?${query}` : ''}`;
  return makeRequest<InvitationsResponse>(endpoint, { method: 'GET' });
}

export type InvitationDetailDTO = {
  id: number;
  team_id: number;
  inviter_id: number;
  invited_email: string;
  invited_user_id: number | null;
  role: string;
  message: string;
  status: string;
  token: string;
  invited_at: string;
  expires_at: string;
  responded_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  cancelled_at: string | null;
  cancelled_by: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
  is_expired: boolean;
  days_until_expiry: number;
};

export async function getInvitationByToken(token: string): Promise<InvitationDetailDTO> {
  return makeRequest<InvitationDetailDTO>(`/invitations/token/${token}`, { method: 'GET' });
}

export async function acceptInvitation(token: string): Promise<InvitationDetailDTO> {
  return makeRequest<InvitationDetailDTO>(`/invitations/${token}/accept`, { method: 'POST' });
}


