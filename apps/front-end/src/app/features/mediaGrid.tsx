import { Link, Outlet, useNavigate, useRouterState, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Media } from '../services/types';
import { MediaCard } from '../components/mediaCard';
import { useMediaList } from '../services/mediaHook';
import { useAuth } from '../context/auth.context';

export default function MediaGrid() {
  const { page = 1, tag = "" } = useSearch({ from: '/media' });
  const [searchTag, setSearchTag] = useState<string>(tag);

  const mediaPerPage = 25;
  const navigate = useNavigate();
  const { location } = useRouterState();
  const fromMediaId = location.state?.fromMediaId;
  const mediaRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { logout } = useAuth();
  
  const onHandleLogout = () => {
    logout();
    navigate({ to: '/' });
  }

  useEffect(() => {
    if (fromMediaId && mediaRefs.current[fromMediaId]) {
      mediaRefs.current[fromMediaId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fromMediaId]);


  const currentPage = page ?? 1;

  const { data, isLoading, error, isFetching } = useMediaList(currentPage, mediaPerPage, tag);

  useEffect(() => {
    if (error?.message.includes('Authentication failed')) {
      navigate({ to: '/' });
    }
  }, [error, navigate]);

  if (isLoading && !data) return <div className="media-grid-loading">Loading media...</div>;
  if (error) return <div className="media-grid-error">Error fetching media: {error.message}</div>;

  const handleNextPage = () => {
    if (data && currentPage < data.totalPages) {
      navigate({
        to: '/media',
        search: (prev) => ({ ...prev, page: page + 1, tag: tag }),
      })
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      navigate({
        to: '/media',
        search: (prev) => ({ ...prev, page: page - 1, tag: tag }),
      })
    }
  };

  const handleTagSearch = () => {
    const trimmedTag = searchTag.trim();
    
    navigate({
      to: '/media',
      search: {
        page: 1,
        ...(trimmedTag ? { tag: trimmedTag } : {}),
      },
    });
  };

  const handleTagClear = () => {
    setSearchTag('');
    navigate({
      to: '/media',
      search: {
        page: 1,
      },
    });
  };

  const mediaList = data?.data || [];
  const totalPages = data?.totalPages || 1;


  return (
    <div className="media-grid-container">
      <div className='search-logout-wrapper'>
      <div className="tag-search">
        <input
          type="text"
          placeholder="Search by tag"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
        />
        <button onClick={handleTagSearch}>Search</button>
        <button onClick={handleTagClear}>Clear</button>
      </div>
        <button
          style={{ display: "flex", marginLeft: "auto" }}
          onClick={onHandleLogout}
        >Logout
        </button>
      </div>
      <h1 className="media-grid-title">Media Gallery</h1>

      <div className="media-grid">
        {mediaList.map((media: Media) => (
          <Link
            to="/media/$mediaId"
            params={{ mediaId: media.id }}
            state={{ fromPage: currentPage }}
            key={media.id}
            className="media-cell"
          >
            <div
              className="media-thumbnail-container"
              ref={(el) => {
                mediaRefs.current[media.id] = el;
              }}
            >
              <MediaCard media={media} className={"media-thumbnail"} />
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