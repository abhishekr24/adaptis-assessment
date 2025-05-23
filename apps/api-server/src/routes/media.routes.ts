import express from 'express';
import {
  getAllMedia,
  getMediaDetail,
  updateComment,
  updateDescription
} from '../controller/media.controller';

const router = express.Router();

router.get('/', getAllMedia);
router.get('/:mediaId', getMediaDetail);
router.post('/:mediaId/comments', updateComment);
router.put('/:mediaId/description', updateDescription);

export default router;