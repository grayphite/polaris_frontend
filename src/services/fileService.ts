import { makeRequest, apiClient } from './api';

// File metadata from backend
export interface FileMetadata {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  file_type: string;
  type: string;
  downloadable: boolean;
  created_at: string;
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  file: FileMetadata;
}

export interface ListFilesResponse {
  success: boolean;
  files: FileMetadata[];
  total: number;
  limit: number;
}

export interface GetFileResponse {
  success: boolean;
  file: FileMetadata;
}

export interface DeleteFileResponse {
  success: boolean;
  message: string;
}

export interface ValidateFilesResponse {
  success: boolean;
  valid: boolean;
  error?: string;
  files: FileMetadata[];
}

/**
 * Upload a file to Anthropic Files API
 * Uses multipart/form-data
 */
export async function uploadFile(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post<UploadFileResponse>(
      '/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
}

/**
 * Get list of uploaded files
 */
export async function listFiles(limit: number = 50): Promise<ListFilesResponse> {
  return makeRequest<ListFilesResponse>(`/files?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * Get metadata for a specific file
 */
export async function getFileMetadata(fileId: string): Promise<GetFileResponse> {
  return makeRequest<GetFileResponse>(`/files/${fileId}`, {
    method: 'GET',
  });
}

/**
 * Delete a file from Anthropic Files API
 */
export async function deleteFile(fileId: string): Promise<DeleteFileResponse> {
  return makeRequest<DeleteFileResponse>(`/files/${fileId}`, {
    method: 'DELETE',
  });
}

/**
 * Validate that file IDs exist and are accessible
 */
export async function validateFiles(fileIds: string[]): Promise<ValidateFilesResponse> {
  return makeRequest<ValidateFilesResponse>('/files/validate', {
    method: 'POST',
    data: { file_ids: fileIds },
  });
}

