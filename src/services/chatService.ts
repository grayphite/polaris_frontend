import { makeRequest } from './api';

export type ChatDTO = { 
  id: number; 
  project_id: number; 
  name: string; 
  description: string;
  created_at: string;
  created_by: number;
  is_deleted: boolean;
};

export interface ChatsResponse {
  chats: ChatDTO[];
  pagination: {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    success: boolean;
  };
}

export async function fetchChats(
  projectId: string, 
  page: number = 1, 
  perPage: number = 10, 
  search?: string
): Promise<ChatsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  
  if (search) {
    params.append('search', search);
  }
  
  const url = `/projects/${projectId}/chats?${params.toString()}`;
  
  return makeRequest<ChatsResponse>(url, { method: 'GET' });
}

export async function fetchChatById(chatId: string): Promise<ChatDTO> {
  return makeRequest<ChatDTO>(`/chat/${chatId}`, { method: 'GET' });
}

export async function createChatApi(projectId: string, name: string, description: string): Promise<ChatDTO> {
  const payload = { 
    name, 
    description, 
    project_id: parseInt(projectId) 
  };
  
  return makeRequest<ChatDTO>(`/chats`, { 
    method: 'POST', 
    data: payload
  });
}

export async function updateChatApi(chatId: string, name: string, description: string): Promise<ChatDTO> {
  return makeRequest<ChatDTO>(`/chats/${chatId}`, { 
    method: 'PUT', 
    data: { name, description } 
  });
}

export async function deleteChatApi(chatId: string): Promise<{ success: boolean }>{
  return makeRequest<{ success: boolean }>(`/chats/${chatId}`, { method: 'DELETE' });
}


