import { Comment } from "../services/types";

type CommentCardProps = {
    comment: Comment
}

export function CommentCard({ comment }: CommentCardProps) {
    return (
        <div className="comment-item">
            <p className="comment-author" style={{display: "flex", gap: "8px", alignItems: "center"}}>
                <strong>{comment.username}</strong>
                <span className="comment-timestamp">
                    ({new Date(comment.timestamp).toLocaleString()})
                </span>
            </p>
            <p className="comment-text">{comment.text}</p>
        </div>
    )
}