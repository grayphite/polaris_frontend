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
  chat_reference_details?: {
    id: number;
    name?: string;
    title?: string;
    description?: string;
    details?: string;
  }[];
  referenced_chat_id?: number;
  referenced_chat_ids?: number[];
  referenced_chat?: {
    id: number;
    name?: string;
    description?: string;
    project_id?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: number;
    is_deleted?: boolean;
  } | number[];
  referenced_chats?: {
    id: number;
    name?: string;
    description?: string;
    title?: string;
    details?: string;
    project_id?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: number;
    is_deleted?: boolean;
  }[];
  context_metadata: {
    api_version: string;
    model_used: string;
    request_timestamp: string;
    file_count?: number;
    file_references?: string[]; // File IDs in message history
  };
  rag_metadata?: {
    rag_enabled: boolean;
    processing_mode: string;
    docs_found: number;
    sources: string[];
    max_relevance_score: number;
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
  rag_metadata?: {
    rag_enabled: boolean;
    processing_mode: string;
    docs_found: number;
    sources: string[];
    max_relevance_score: number;
  };
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
  referencedChatIds?: string[],
  onStreamChunk?: (text: string) => void,
  onStreamComplete?: (data: any) => void
): Promise<SendMessageResponse> {
  const payload: any = {
    chat_id: parseInt(chatId),
    user_question: userQuestion,
    use_rag: true
  };
  
  // Add file references to payload if provided
  if (fileReferences && fileReferences.length > 0) {
    payload.file_references = fileReferences;
  }
  
  // Add file reference details to payload if provided
  if (fileReferenceDetails && fileReferenceDetails.length > 0) {
    payload.file_reference_details = fileReferenceDetails;
  }

  if (referencedChatIds && referencedChatIds.length > 0) {
    const parsedIds = referencedChatIds
      .map((id) => parseInt(id, 10))
      .filter((value) => !Number.isNaN(value));
    if (parsedIds.length > 0) {
      payload.referenced_chat_ids = parsedIds;
    }
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
        // Call the stream complete callback immediately with sources
        if (onStreamComplete) {
          onStreamComplete(chunk);
        }
      }
    }
  );
  
  // Return the complete data in the expected format
  if (completeData && completeData.ai_chat) {
    return {
      success: true,
      message: completeData.message || 'AI chat created successfully',
      ai_chat: completeData.ai_chat,
      rag_metadata: completeData.rag_metadata,
    };
  }
  
  throw new Error('Stream completed without receiving complete data');
}

// Get messages for a chat
export interface ChatReferencesMappingResponse {
  chat_id: number;
  references?: Record<string, number[]>;
  referenced_chat_ids?: number[];
}

export async function getChatReferencesMapping(
  chatId: string
): Promise<ChatReferencesMappingResponse> {
  const params = new URLSearchParams({
    chat_id: chatId,
  });

  return makeRequest<ChatReferencesMappingResponse>(
    `/ai-chats/chat-references-mapping?${params.toString()}`,
    { method: 'GET' }
  );
}

export async function refreshChatSummary(
  referencedChatId: string | number
): Promise<{ success: boolean }> {
  const payload = {
    referenced_chat_id: typeof referencedChatId === 'string' ? parseInt(referencedChatId, 10) : referencedChatId,
  };

  return makeRequest<{ success: boolean }>(`/ai-chats/refresh-chat-summary`, {
    method: 'POST',
    data: payload,
  });
}

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


