import { MediaModel } from "../models/media.model";

export async function initializeDatabase() {
    const count = await MediaModel.countDocuments();
    if (count === 0) {
      const mockMediaItems = Array.from({ length: 100 }, (_, i) => {
        const isVideo = Math.random() < 0.25;
        return ({
        url: isVideo
            ? 'https://sample-videos.com/video321/mp4/480/big_buck_bunny_480p_1mb.mp4'
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