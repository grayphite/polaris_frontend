import { makeRequest } from './api';

export interface RegisterUserData {
  email: string;
  senha: string;
  nome?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  error?: string;
}

export async function registerUser(userData: RegisterUserData): Promise<RegisterResponse> {
  return makeRequest<RegisterResponse>('/users/register', {
    method: 'POST',
    data: userData,
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
  return makeRequest('/users/forgot-password', {
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

