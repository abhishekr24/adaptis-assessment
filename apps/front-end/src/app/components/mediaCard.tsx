import { Media } from "../services/types";

type MediaCardProps = {
    media: Media,
    className: string
}

export function MediaCard({media, className}: MediaCardProps) {
    return (
        <>
        {media.mediaType === 'video' ? (
            <video
            src={media.url}
            className={className}
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
              src={media.url}
              alt={media.title}
              className={className}
            />
          )}
          </>
    )
}