import { Router } from 'express';
import { getAuthUrl, oauthCallback, uploadVideo } from '../controllers/youtube.controller';

const router = Router();

router.get('/auth/youtube', getAuthUrl);
router.get('/auth/youtube/callback', oauthCallback);
router.post('/youtube/upload', uploadVideo);

export default router;
