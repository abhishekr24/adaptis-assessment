import { MediaModel } from "../models/media.model";

async function fetchPexelsVideos(pexelsAPIKey: string): Promise<string[]> {
  const response = await fetch(`https://api.pexels.com/videos/search?query=nature&per_page=100`, {
    headers: {
      Authorization: pexelsAPIKey,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch videos from Pexels');
    return [];
  }

  const data: any = await response.json();
  const videoUrls: string[] = [];

  for (const video of data.videos) {
    const matchingFile = video.video_files.find(
      (file: any) =>
        file.width === 720 &&
        file.file_type === 'video/mp4'
    );
    if (matchingFile) {
      videoUrls.push(matchingFile.link);
    }
  }

  return videoUrls;
}

export async function initializeDatabase(pexelsAPIKey: string) {
    const count = await MediaModel.countDocuments();
    const videoUrls = await fetchPexelsVideos(pexelsAPIKey);
    if (count === 0) {
      const mockMediaItems = Array.from({ length: 100 }, (_, i) => {
        const isVideo = Math.random() < 0.25;
        const videoUrl = videoUrls[i % videoUrls.length]; 
        return ({
        url: isVideo
            ? videoUrl
            : `https://picsum.photos/seed/media${i}/600/400`,
        title: `${isVideo ? 'Video' : 'Image'} ${i + 1}`,
        description: `This is a detailed description for Media ${i + 1}. It can be quite long and informative, discussing the nuances and context of the visual content presented. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        mediaType: isVideo ? 'video' : 'image'
      })
      });
  
      try {
        await MediaModel.insertMany(mockMediaItems);
        console.log('Database initialized with mock media items');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }
  }