import { useParams, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Field } from '@ark-ui/react/field';
import { MediaCard } from '../components/mediaCard';
import { useAddComment, useMediaDetail, useUpdateDescription, useUpdateTags } from '../services/mediaHook';
import { CommentCard } from '../components/commentCard';

export default function SingleMedia() {
  const params = useParams({ from: '/media/$mediaId' });
  const mediaId = params.mediaId;
  const navigate = useNavigate();
  const { location } = useRouterState();
  const fromPage = location.state?.fromPage ?? 1;

  const [newComment, setNewComment] = useState('');
  const [editedDescription, setEditedDescription] = useState<string | undefined>('');
  const [tagsInput, setTagsInput] = useState<string>("")
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);

  const { data: mediaData, isLoading, error } = useMediaDetail(mediaId)
  const { mutate: updateDescription, isPending: descriptionMutationIsPending } = useUpdateDescription(mediaId);
  const { mutate: updateTags, isPending: tagsMutationIsPending } = useUpdateTags(mediaId);
  const { mutate: addComment, isPending: addCommentIsPending } = useAddComment(mediaId);

  const handleTagUpdate = () => {
    if (mediaData) {
      setIsEditingTags(true);
      const newTags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && !mediaData?.tags.includes(tag));

      const updatedTags = [...mediaData?.tags, ...newTags];
      updateTags({ mediaId, tags: updatedTags }, {
        onSuccess: () => {
          setIsEditingTags(false);
          setTagsInput("");
        }
      });
    }
  };

  const handleDescriptionSave = () => {
    if (mediaId && editedDescription !== undefined) {
      updateDescription({ mediaId, description: editedDescription }, {
        onSuccess: () => {
          setIsEditingDescription(false);
        }
      });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaId && newComment.trim()) {
      addComment({ mediaId, text: newComment.trim() }, {
        onSuccess: () => {
          setNewComment('');
        }
      });
    }
  };

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

  if (isLoading) return <div className="single-media-loading">Loading media...</div>;
  if (error) return <div className="single-media-error">Error: {error.message}</div>;
  if (!mediaData) return <div className="single-media-not-found">Media not found.</div>;

  return (
    <div className="single-media-container">
      <button
        onClick={() => navigate({ to: '/media', search: { page: fromPage }, state: { fromMediaId: mediaId }, })}
        className="back-to-gallery-button">
        &larr; Back to Gallery
      </button>
      <h1 className="single-media-title">{mediaData.title}</h1>

      <div className="tags-section">
        <h3>Tags</h3>
        <form
          className="tags-input-wrapper"
          onSubmit={(e) => {
            e.preventDefault();
            handleTagUpdate();
          }}
        >
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Comma-separated tags"
          />
          <button type="submit" disabled={isEditingTags}>
            {tagsMutationIsPending ? 'Updating...' : 'Update Tags'}
          </button>
        </form>
        <div className="tags-display">
          {mediaData.tags.map((tag) => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
        </div>
      </div>

      <div className="single-media-media">
        <MediaCard media={mediaData} className={"single-media-display"} />
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
              <button onClick={handleDescriptionSave} disabled={descriptionMutationIsPending} className="save-button">
                {descriptionMutationIsPending ? 'Saving...' : 'Save Description'}
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
        <h2 className="section-title">Comments ({mediaData?.comments?.length})</h2>
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
          <button type="submit" disabled={addCommentIsPending} className="submit-button">
            {addCommentIsPending ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
        <div className="comments-list">
          {mediaData?.comments?.length > 0 ? (
            mediaData.comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))
          ) : (
            <p className="no-comments-text">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
} 