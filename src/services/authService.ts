import { makeRequest } from './api';

export interface RegisterUserData {
  email: string;
  senha: string;
  first_name: string;
  last_name: string;
  invitation_token?: string;
}

export interface TeamSubscriptionPlan {
  id: number;
  code: string;
  display_name: string;
  max_team_members_per_team: number;
}

export interface TeamSubscriptionPrice {
  id: number;
  nickname: string;
  amount_cents: number;
  currency: string;
  trial_days: number;
  per_seat_amount_cents: number;
}

export interface TeamSubscription {
  id: number;
  status: 'trialing' | 'active' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'canceled' | 'unpaid';
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  quantity: number;
  plan: TeamSubscriptionPlan;
  price: TeamSubscriptionPrice;
  billing_user_id: number;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
}

export interface TeamOwner {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  created_by: number;
  is_deleted: boolean;
  owner: TeamOwner;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  error?: string;
  team_subscriptions?: TeamSubscription[];
  teams?: Team[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  error?: string;
  team_subscriptions?: TeamSubscription[];
  teams?: Team[];
}

export async function registerUser(userData: RegisterUserData): Promise<RegisterResponse> {
  return makeRequest<RegisterResponse>('/users/register', {
    method: 'POST',
    data: {
      ...userData,
      invitation_token: userData.invitation_token || '',
    },
  });
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return makeRequest<LoginResponse>('/users/login', {
    method: 'POST',
    data: {
      email,
      senha: password,
    },
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return makeRequest('/users/forget-password', {
    method: 'POST',
    data: { email },
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return makeRequest('/users/reset-password', {
    method: 'POST',
    data: {
      token,
      senha: newPassword,
    },
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return makeRequest('/users/change-password', {
    method: 'POST',
    data: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export async function updateProfile(userId: string, firstName: string, lastName: string): Promise<{ success: boolean; message: string; user?: any }> {
  return makeRequest(`/users/${userId}`, {
    method: 'PUT',
    data: {
      first_name: firstName,
      last_name: lastName,
    },
  });
}

