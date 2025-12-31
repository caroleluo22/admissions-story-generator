import { Router } from 'express';
import { generate, listStories, getStory, deleteStory, regenerate, duplicateStory, generateArticle, generateStoryboard, updateScene, generateSceneImage, generateSceneAudio, generateSceneVideo, addScene, removeScene, moveScene, proxyAsset, updateScript, analyzeVideo, updateArticle } from '../controllers/story.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/proxy', proxyAsset);

router.use(authenticateToken);

router.post('/analyze-video', analyzeVideo);
router.post('/generate', generate);
router.get('/', listStories);
router.get('/:id', getStory);
router.delete('/:id', deleteStory);
router.post('/:id/regenerate', regenerate);
router.post('/:id/duplicate', duplicateStory);
router.post('/:id/article', generateArticle);
router.put('/:id/article', updateArticle);
router.post('/:id/storyboard', generateStoryboard);
router.patch('/:id/scenes/:index', updateScene);
router.post('/:id/scenes/add', addScene);
router.delete('/:id/scenes/:index', removeScene);
router.post('/:id/scenes/:index/move', moveScene);
router.post('/:id/scenes/:index/image', generateSceneImage);
router.post('/:id/scenes/:index/audio', generateSceneAudio);
router.post('/:id/scenes/:index/video', generateSceneVideo);
router.put('/:id/script', updateScript);

export default router;
