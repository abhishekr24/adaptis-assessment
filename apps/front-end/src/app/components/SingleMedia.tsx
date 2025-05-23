import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Field } from '@ark-ui/react/field';

interface MediaDetail {
  id: string;
  url: string;
  title: string;
  description?: string;
  mediaType: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  mediaId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string; 
}

interface UpdateDescriptionVariables {
  mediaId: string;
  description: string;
}

interface AddCommentVariables {
  mediaId: string;
  text: string;
}

const API_BASE_URL = 'http://localhost:8080'; 
const MOCK_TOKEN = 'mocktoken'; 

const fetchMediaDetail = async (mediaId: string): Promise<MediaDetail> => {
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
    headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Authentication failed. Please login again.');
    throw new Error('Failed to fetch media details');
  }
  return response.json();
};

const updateMediaDescription = async (variables: UpdateDescriptionVariables): Promise<MediaDetail> => {
  const { mediaId, description } = variables;
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}/description`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${MOCK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error('Failed to update description');
  return response.json();
};

const addComment = async (variables: AddCommentVariables): Promise<Comment> => {
  const { mediaId, text } = variables;
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MOCK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
};

export default function SingleMedia() {
  const params = useParams({ from: '/media/$mediaId' }); 
  const mediaId = params.mediaId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [editedDescription, setEditedDescription] = useState<string | undefined>('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const mediaQueryKey = ['media', mediaId] as const;

  const { data: mediaData, isLoading, error } = useQuery<
    MediaDetail,
    Error,
    MediaDetail,
    typeof mediaQueryKey
  >({
    queryKey: mediaQueryKey,
    queryFn: () => fetchMediaDetail(mediaId),
    enabled: !!mediaId
  });

  useEffect(() => {
    if (mediaData) {
      setEditedDescription(mediaData.description);
    }
  }, [mediaData]);

  useEffect(() => {
    if (error) {
        console.error("Error fetching media:", error.message);
        if (error.message.toLowerCase().includes('auth')) {
            navigate({ to: '/' });
        }
    }
  }, [error, navigate]);

  const descriptionMutation = useMutation<
    MediaDetail,
    Error,
    UpdateDescriptionVariables
  >({
    mutationFn: updateMediaDescription,
    onSuccess: (updatedMedia) => {
      queryClient.setQueryData<MediaDetail>(mediaQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...updatedMedia,
          comments: oldData.comments 
        };
      });
      setIsEditingDescription(false);
    }
  });

  const commentMutation = useMutation<
    Comment,
    Error,
    AddCommentVariables
  >({
    mutationFn: addComment,
    onSuccess: (newCommentData) => {
      queryClient.setQueryData<MediaDetail>(mediaQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          comments: [newCommentData, ...oldData.comments]
        };
      });
      setNewComment('');
    }
  });

  const handleDescriptionSave = () => {
    if (mediaId && editedDescription !== undefined) {
      descriptionMutation.mutate({ mediaId, description: editedDescription });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaId && newComment.trim()) {
      commentMutation.mutate({ mediaId, text: newComment.trim() });
    }
  };

  if (isLoading) return <div className="single-media-loading">Loading media...</div>;
  if (error) return <div className="single-media-error">Error: {error.message}</div>;
  if (!mediaData) return <div className="single-media-not-found">Media not found.</div>;

  return (
    <div className="single-media-container">
      <button onClick={() => navigate({ to: '/media' })} className="back-to-gallery-button">
        &larr; Back to Gallery
      </button>
      <h1 className="single-media-title">{mediaData.title}</h1>
      
      <div className="single-media-media">
        {mediaData.mediaType === 'video' ? (
          <video
          src={mediaData.url}
          className="single-media-display"
          muted
          preload="metadata"
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
        ) : (
          <img
            src={mediaData.url}
            alt={mediaData.title}
            className="single-media-display"
          />
        )}
      </div>

      <div className="description-section">
        <h2 className="section-title">Description</h2>
        {isEditingDescription ? (
          <>
            <Field.Root>
              <Field.Textarea
                value={editedDescription || ''}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="description-textarea"
                rows={5}
              />
            </Field.Root>
            <div className="description-actions">
              <button onClick={handleDescriptionSave} disabled={descriptionMutation.isPending} className="save-button">
                {descriptionMutation.isPending ? 'Saving...' : 'Save Description'}
              </button>
              <button onClick={() => {
                setIsEditingDescription(false);
                setEditedDescription(mediaData.description);
              }} className="cancel-button">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="description-text">{mediaData.description || 'No description available.'}</p>
            <button onClick={() => setIsEditingDescription(true)} className="edit-button">
              Edit Description
            </button>
          </>
        )}
      </div>

      <div className="comments-section">
        <h2 className="section-title">Comments ({mediaData.comments.length})</h2>
        <form onSubmit={handleAddComment} className="comment-form">
          <Field.Root>
            <Field.Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="comment-textarea"
              rows={3}
              required
              style={{ resize: 'none', height: '100px' }}
            />
          </Field.Root>
          <button type="submit" disabled={commentMutation.isPending} className="submit-button">
            {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
        <div className="comments-list">
          {mediaData.comments.length > 0 ? (
            mediaData.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <p className="comment-author">
                  <strong>{comment.username}</strong> 
                  <span className="comment-timestamp">
                    ({new Date(comment.timestamp).toLocaleString()})
                  </span>
                </p>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="no-comments-text">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
} 