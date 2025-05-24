import { QueryKey } from "@tanstack/react-query";
import { ApiResponse, MediaDetail, API_BASE_URL, UpdateDescriptionVariables, AddCommentVariables, Comment, UpdateTagsVariables } from "./types";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
};

export const fetchMedia = async ({ queryKey }: { queryKey: QueryKey }): Promise<ApiResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_key, page, limit, tag] = queryKey as [string, number, number, string]; 
  // const token = 'mocktoken'; 
  const response = await fetch(`http://localhost:8080/media?page=${page}&limit=${limit}&tag=${tag}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please login again.');
    }
    throw new Error('Network response was not ok');
  }
  return response.json();
};
  
export const fetchMediaDetail = async (mediaId: string): Promise<MediaDetail> => {
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Authentication failed. Please login again.');
    throw new Error('Failed to fetch media details');
  }
  return response.json();
};

export const updateMediaDescription = async (variables: UpdateDescriptionVariables): Promise<MediaDetail> => {
  const { mediaId, description } = variables;
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}/description`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error('Failed to update description');
  return response.json();
};
  
export const addComment = async (variables: AddCommentVariables): Promise<Comment> => {
  const { mediaId, text } = variables;
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
};

export const updateMediaTags = async (variables: UpdateTagsVariables): Promise<MediaDetail> => {
  const { mediaId, tags } = variables;
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}/tags`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tags }),
  });
  if (!response.ok) throw new Error('Failed to update tags');
  return response.json();
};