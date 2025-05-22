import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Field } from '@ark-ui/react/field';

interface ImageDetail {
  id: string;
  url: string;
  title: string;
  description?: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  imageId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string; 
}

interface UpdateDescriptionVariables {
  imageId: string;
  description: string;
}

interface AddCommentVariables {
  imageId: string;
  text: string;
}

const API_BASE_URL = 'http://localhost:8080'; 
const MOCK_TOKEN = 'mocktoken'; 

const fetchImageDetail = async (imageId: string): Promise<ImageDetail> => {
  const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
    headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Authentication failed. Please login again.');
    throw new Error('Failed to fetch image details');
  }
  return response.json();
};

const updateImageDescription = async (variables: UpdateDescriptionVariables): Promise<ImageDetail> => {
  const { imageId, description } = variables;
  const response = await fetch(`${API_BASE_URL}/images/${imageId}/description`, {
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
  const { imageId, text } = variables;
  const response = await fetch(`${API_BASE_URL}/images/${imageId}/comments`, {
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

export default function SingleImage() {
  const params = useParams({ from: '/images/$imageId' }); 
  const imageId = params.imageId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [editedDescription, setEditedDescription] = useState<string | undefined>('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const imageQueryKey = ['image', imageId] as const;

  const { data: imageData, isLoading, error } = useQuery<
    ImageDetail,
    Error,
    ImageDetail,
    typeof imageQueryKey
  >({
    queryKey: imageQueryKey,
    queryFn: () => fetchImageDetail(imageId),
    enabled: !!imageId
  });

  useEffect(() => {
    if (imageData) {
      setEditedDescription(imageData.description);
    }
  }, [imageData]);

  useEffect(() => {
    if (error) {
        console.error("Error fetching image:", error.message);
        if (error.message.toLowerCase().includes('auth')) {
            navigate({ to: '/' });
        }
    }
  }, [error, navigate]);

  const descriptionMutation = useMutation<
    ImageDetail,
    Error,
    UpdateDescriptionVariables
  >({
    mutationFn: updateImageDescription,
    onSuccess: (updatedImage) => {
      queryClient.setQueryData<ImageDetail>(imageQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...updatedImage,
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
      queryClient.setQueryData<ImageDetail>(imageQueryKey, (oldData) => {
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
    if (imageId && editedDescription !== undefined) {
      descriptionMutation.mutate({ imageId, description: editedDescription });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageId && newComment.trim()) {
      commentMutation.mutate({ imageId, text: newComment.trim() });
    }
  };

  if (isLoading) return <div className="single-image-loading">Loading image...</div>;
  if (error) return <div className="single-image-error">Error: {error.message}</div>;
  if (!imageData) return <div className="single-image-not-found">Image not found.</div>;

  return (
    <div className="single-image-container">
      <button onClick={() => navigate({ to: '/images' })} className="back-to-gallery-button">
        &larr; Back to Gallery
      </button>
      <h1 className="single-image-title">{imageData.title}</h1>
      
      <div className="single-image-media">
        <img src={imageData.url} alt={imageData.title} className="single-image-display" />
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
                setEditedDescription(imageData.description);
              }} className="cancel-button">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="description-text">{imageData.description || 'No description available.'}</p>
            <button onClick={() => setIsEditingDescription(true)} className="edit-button">
              Edit Description
            </button>
          </>
        )}
      </div>

      <div className="comments-section">
        <h2 className="section-title">Comments ({imageData.comments.length})</h2>
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
          {imageData.comments.length > 0 ? (
            imageData.comments.map((comment) => (
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