import { Router } from 'express';
import { getGuidelines, updateGuidelines } from '../controllers/brand.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getGuidelines);
router.put('/', updateGuidelines);

export default router;
