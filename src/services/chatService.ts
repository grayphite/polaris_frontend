import { makeRequest } from './api';

export type ChatDTO = { id: string; projectId: string; title: string; details?: string };

export async function fetchChats(projectId: string): Promise<ChatDTO[]> {
  return makeRequest<ChatDTO[]>(`/chats?projectId=${encodeURIComponent(projectId)}`, { method: 'GET' });
}

export async function fetchChatById(chatId: string): Promise<ChatDTO> {
  return makeRequest<ChatDTO>(`/chat/${chatId}`, { method: 'GET' });
}

export async function createChatApi(projectId: string, title: string, details: string): Promise<ChatDTO> {
  return makeRequest<ChatDTO>(`/chat`, { method: 'POST', data: { projectId, title, details } });
}

export async function updateChatApi(chatId: string, title: string, details: string): Promise<ChatDTO> {
  return makeRequest<ChatDTO>(`/chat`, { method: 'PUT', data: { id: chatId, title, details } });
}

export async function deleteChatApi(chatId: string): Promise<{ success: boolean }>{
  return makeRequest<{ success: boolean }>(`/chat/${chatId}`, { method: 'DELETE' });
}


