import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useQuery, QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Image {
  id: string;
  url: string;
  title: string;
}

interface ApiResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalImages: number;
  data: Image[];
}

const fetchImages = async ({ queryKey }: { queryKey: QueryKey }): Promise<ApiResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_key, page, limit] = queryKey as [string, number, number]; 
  const token = 'mocktoken'; 
  const response = await fetch(`http://localhost:8080/images?page=${page}&limit=${limit}`, {
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

export default function ImageGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 25; 
  const navigate = useNavigate();

  const { data, isLoading, error, isFetching } = useQuery<ApiResponse, Error, ApiResponse, QueryKey>({
    queryKey: ['images', currentPage, imagesPerPage],
    queryFn: fetchImages,
  });

  useEffect(() => {
    if (error?.message.includes('Authentication failed')) {
      navigate({ to: '/' }); 
    }
  }, [error, navigate]);

  if (isLoading && !data) return <div className="image-grid-loading">Loading images...</div>; 
  if (error) return <div className="image-grid-error">Error fetching images: {error.message}</div>;

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

  const imageList = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="image-grid-container">
      <h1 className="image-grid-title">Image Gallery</h1>

      <div className="image-grid">
        {imageList.map((image: Image) => (
          <Link 
            to="/images/$imageId" 
            params={{ imageId: image.id }} 
            key={image.id} 
            className="image-cell"
          >
            <div className="image-thumbnail-container">
              <img src={image.url} alt={image.title} className="image-thumbnail" />
            </div>
            <p className="image-cell-title">{image.title}</p>
          </Link>
        ))}
      </div>

      {imageList.length === 0 && !isFetching && (
        <p className="image-grid-empty">No images found for this page.</p>
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