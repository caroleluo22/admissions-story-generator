import { Request, Response } from 'express';
import BrandGuidelines from '../models/BrandGuidelines';
import Workspace from '../models/Workspace';

// Helper to get workspace ID from user ID (assuming 1 workspace per user for v1)
// In a real app, workspaceId would likely come from a header or the user context if multi-tenant
const getWorkspaceId = async (userId: string) => {
    const workspace = await Workspace.findOne({ ownerId: userId });
    return workspace ? workspace._id : null;
};

export const getGuidelines = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - user is attached by auth middleware
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);

        if (!workspaceId) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        let guidelines = await BrandGuidelines.findOne({ workspaceId });

        if (!guidelines) {
            // Return defaults if none exist yet
            return res.json({
                toneOfVoice: '',
                bannedTerms: [],
                defaultDisclaimer: '',
                defaultLinks: ''
            });
        }

        res.json(guidelines);
    } catch (error) {
        console.error('Get guidelines error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateGuidelines = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);

        if (!workspaceId) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const { toneOfVoice, bannedTerms, defaultDisclaimer, defaultLinks } = req.body;

        const guidelines = await BrandGuidelines.findOneAndUpdate(
            { workspaceId },
            {
                workspaceId,
                toneOfVoice,
                bannedTerms,
                defaultDisclaimer,
                defaultLinks
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(guidelines);
    } catch (error) {
        console.error('Update guidelines error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
