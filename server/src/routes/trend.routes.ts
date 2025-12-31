import { Router } from 'express';
import { analyze, deepDive, analyzeLeads, getHistory, getHistoryItem, getStorySuggestions } from '../controllers/trend.controller';

import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to populate req.user for history saving
router.post('/analyze', authenticateToken, analyze);
router.post('/deep-dive', deepDive);
router.post('/leads', analyzeLeads);

// History routes
router.get('/history', authenticateToken, getHistory);
router.get('/history/:id', authenticateToken, getHistoryItem);

// Suggestions
router.post('/suggestions', getStorySuggestions);

export default router;
