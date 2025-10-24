import { makeRequest, makeStreamRequest } from './api';
import { FileMetadata } from './fileService';

export type ChatDTO = { 
  id: number; 
  project_id: number; 
  name: string; 
  description: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  is_deleted: boolean;
  aichat_count?: number;
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

// AI Chat Message Types
export type AIChatMessageDTO = {
  id: number;
  chat_id: number;
  user_id: number;
  user_question: string;
  ai_answer: string;
  ai_model: string;
  ai_model_provider: string;
  conversation_context: string;
  chat_name?: string; // Add optional chat_name field for auto-naming
  file_references?: string[]; // Array of file IDs
  file_reference_details?: FileMetadata[]; // Array of file objects from backend
  context_metadata: {
    api_version: string;
    model_used: string;
    request_timestamp: string;
    file_count?: number;
    file_references?: string[]; // File IDs in message history
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: number | null;
  is_deleted: boolean;
};

export interface SendMessageResponse {
  success: boolean;
  message: string;
  ai_chat: AIChatMessageDTO;
}

export interface GetMessagesResponse {
  success: boolean;
  ai_chats: AIChatMessageDTO[];
  pagination: {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    per_page: number;
    total: number;
  };
}

// Send message to AI chat with streaming support
export async function sendMessageApi(
  chatId: string, 
  userQuestion: string,
  fileReferences?: string[],
  fileReferenceDetails?: FileMetadata[],
  onStreamChunk?: (text: string) => void
): Promise<SendMessageResponse> {
  const payload: any = {
    chat_id: parseInt(chatId),
    user_question: userQuestion,
    use_rag: true,
  };
  
  // Add file references to payload if provided
  if (fileReferences && fileReferences.length > 0) {
    payload.file_references = fileReferences;
  }
  
  // Add file reference details to payload if provided
  if (fileReferenceDetails && fileReferenceDetails.length > 0) {
    payload.file_reference_details = fileReferenceDetails;
  }
  
  let accumulatedText = '';
  let completeData: any = null;
  
  // Use makeStreamRequest for SSE streaming
  await makeStreamRequest(
    '/ai-chats/send-message-stream',
    payload,
    (chunk) => {
      // Handle content_block_delta events for streaming text
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        accumulatedText += chunk.delta.text;
        if (onStreamChunk) {
          onStreamChunk(accumulatedText);
        }
      }
      
      // Handle stream_complete event for final data
      if (chunk.type === 'stream_complete' && chunk.ai_chat) {
        completeData = chunk;
      }
    }
  );
  
  // Return the complete data in the expected format
  if (completeData && completeData.ai_chat) {
    return {
      success: true,
      message: completeData.message || 'AI chat created successfully',
      ai_chat: completeData.ai_chat,
    };
  }
  
  throw new Error('Stream completed without receiving complete data');
}

// Get messages for a chat
export async function getChatMessages(
  chatId: string,
  page: number = 1,
  perPage: number = 10
): Promise<GetMessagesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  
  return makeRequest<GetMessagesResponse>(
    `/chats/${chatId}/ai-chats?${params.toString()}`,
    { method: 'GET' }
  );
}


