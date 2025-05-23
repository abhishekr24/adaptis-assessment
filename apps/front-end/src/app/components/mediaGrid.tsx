import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useQuery, QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Media {
  id: string;
  url: string;
  title: string;
  mediaType: string;
}

interface ApiResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalMedia: number;
  data: Media[];
}

const fetchMedia = async ({ queryKey }: { queryKey: QueryKey }): Promise<ApiResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_key, page, limit] = queryKey as [string, number, number]; 
  const token = 'mocktoken'; 
  const response = await fetch(`http://localhost:8080/media?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please login again.');
    }
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default function MediaGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const mediaPerPage = 25; 
  const navigate = useNavigate();

  const { data, isLoading, error, isFetching } = useQuery<ApiResponse, Error, ApiResponse, QueryKey>({
    queryKey: ['media', currentPage, mediaPerPage],
    queryFn: fetchMedia,
  });

  useEffect(() => {
    if (error?.message.includes('Authentication failed')) {
      navigate({ to: '/' }); 
    }
  }, [error, navigate]);

  if (isLoading && !data) return <div className="media-grid-loading">Loading media...</div>; 
  if (error) return <div className="media-grid-error">Error fetching media: {error.message}</div>;

  const handleNextPage = () => {
    if (data && currentPage < data.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const mediaList = data?.data || [];
  const totalPages = data?.totalPages || 1;

  console.log('mediaList', mediaList);

  return (
    <div className="media-grid-container">
      <h1 className="media-grid-title">Media Gallery</h1>

      <div className="media-grid">
      {mediaList.map((media: Media) => (
  <Link 
    to="/media/$mediaId" 
    params={{ mediaId: media.id }} 
    key={media.id} 
    className="media-cell"
  >
    <div className="media-thumbnail-container">
      {media.mediaType === 'video' ? (
        <video
        src={media.url}
        className="media-thumbnail"
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
          className="media-thumbnail"
        />
      )}
    </div>
    <p className="media-cell-title">{media.title}</p>
  </Link>
))}
      </div>

      {mediaList.length === 0 && !isFetching && (
        <p className="media-grid-empty">No media found for this page.</p>
      )}

      <div className="pagination-controls">
        <button onClick={handlePreviousPage} disabled={currentPage === 1 || isFetching}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={!data || currentPage === data.totalPages || isFetching}>
          Next
        </button>
      </div>
      <Outlet />
    </div>
  );
} 