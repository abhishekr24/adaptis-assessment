import express from 'express';
import {
  getAllMedia,
  getMediaDetail,
  updateComment,
  updateDescription,
  updateTags
} from '../controller/media.controller';

const router = express.Router();

router.get('/', getAllMedia);
router.get('/:mediaId', getMediaDetail);
router.post('/:mediaId/comments', updateComment);
router.put('/:mediaId/description', updateDescription);
router.put('/:mediaId/tags', updateTags)

export default router;