export interface Media {
    id: string;
    url: string;
    title: string;
    mediaType: string;
}

export interface ApiResponse {
    page: number;
    limit: number;
    totalPages: number;
    totalMedia: number;
    data: Media[];
}

export interface Comment {
    id: string;
    mediaId: string;
    userId: string;
    username: string;
    text: string;
    timestamp: string;
}

export interface MediaDetail {
    id: string;
    url: string;
    title: string;
    description?: string;
    mediaType: string;
    comments: Comment[];
}

export interface UpdateDescriptionVariables {
    mediaId: string;
    description: string;
}

export interface AddCommentVariables {
    mediaId: string;
    text: string;
}

export const API_BASE_URL = 'http://localhost:8080';
export const MOCK_TOKEN = 'mocktoken'; 