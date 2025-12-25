import { Request, Response } from 'express';
import { analyzeBusinessTrends, getTopicDeepDive, generatePostLeads } from '../services/trend.service';
import { Platform } from '../../../shared/types/trend';

export const analyze = async (req: Request, res: Response) => {
    try {
        const { businessName, platform } = req.body;
        if (!businessName || !platform) {
            return res.status(400).json({ message: 'Missing businessName or platform' });
        }

        const report = await analyzeBusinessTrends(businessName, platform as Platform);
        res.json(report);
    } catch (error: any) {
        console.error('Trend analysis error:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze trends' });
    }
};

export const deepDive = async (req: Request, res: Response) => {
    try {
        const { businessName, platform, topic } = req.body;
        if (!businessName || !platform || !topic) {
            return res.status(400).json({ message: 'Missing parameters' });
        }

        const posts = await getTopicDeepDive(businessName, platform as Platform, topic);
        res.json(posts);
    } catch (error: any) {
        console.error('Deep dive error:', error);
        res.status(500).json({ message: error.message || 'Failed to perform deep dive' });
    }
};

export const analyzeLeads = async (req: Request, res: Response) => {
    try {
        const { businessName, platform, content, url } = req.body;
        const leads = await generatePostLeads(businessName, platform as Platform, content, url);
        res.json(leads);
    } catch (error: any) {
        console.error('Lead analysis error:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze leads' });
    }
};
