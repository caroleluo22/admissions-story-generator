import { Router } from 'express';
import { analyze, deepDive, analyzeLeads } from '../controllers/trend.controller';

const router = Router();

router.post('/analyze', analyze);
router.post('/deep-dive', deepDive);
router.post('/leads', analyzeLeads);

export default router;
