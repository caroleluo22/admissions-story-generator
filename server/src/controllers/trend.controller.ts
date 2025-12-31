import { Request, Response } from 'express';
import { analyzeBusinessTrends, getTopicDeepDive, generatePostLeads, generateStorySuggestions } from '../services/trend.service';

import { Platform } from '../../../shared/types/trend';
import { TrendAnalysis } from '../models/TrendAnalysis';

export const analyze = async (req: Request, res: Response) => {
    try {
        const { businessName, platform } = req.body;
        if (!businessName || !platform) {
            return res.status(400).json({ message: 'Missing businessName or platform' });
        }

        const report = await analyzeBusinessTrends(businessName, platform as Platform);

        // Save to history if user is authenticated
        // @ts-ignore
        if (req.user && req.user.userId) {
            try {
                await TrendAnalysis.create({
                    // @ts-ignore
                    userId: req.user.userId,
                    businessName,
                    platform,
                    data: report
                });
            } catch (saveError) {
                console.error('Failed to save trend analysis history:', saveError);
                // Don't fail the request if saving history fails
            }
        }

        res.json(report);
    } catch (error: any) {
        console.error('Trend analysis error:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze trends' });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User ID not found' });
        }

        const history = await TrendAnalysis.find({ userId })
            .select('businessName platform createdAt _id') // Select only necessary fields for list
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(history);
    } catch (error: any) {
        console.error('Get history error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch history' });
    }
};

export const getHistoryItem = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.userId;
        const { id } = req.params;

        const item = await TrendAnalysis.findOne({ _id: id, userId });
        if (!item) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        res.json(item.data);
    } catch (error: any) {
        console.error('Get history item error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch analysis' });
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

export const getStorySuggestions = async (req: Request, res: Response) => {
    try {
        const { businessName, platform, topic, persona } = req.body;
        if (!businessName || !platform || !topic) {
            return res.status(400).json({ message: 'Missing parameters' });
        }

        // @ts-ignore
        const suggestions = await generateStorySuggestions(businessName, platform as Platform, topic, persona || 'Audience');
        res.json(suggestions);
    } catch (error: any) {
        console.error('Suggestion generation error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate suggestions' });
    }
};
