import { Request, Response } from 'express';
import BrandGuidelines from '../models/BrandGuidelines';
import Workspace from '../models/Workspace';
import StoryProject from '../models/StoryProject';
import { buildStoryPrompt, buildRegeneratePrompt, buildArticlePrompt, buildStoryboardPrompt } from '../services/promptBuilder.service';
import { generateStory, regenerateSection as callLLMForSection, generateImage, generateAudio, generateVideo } from '../services/llm.service';
import { SceneStatus } from '../../../shared/types/story';
import https from 'https';

const getWorkspaceId = async (userId: string) => {
    const workspace = await Workspace.findOne({ ownerId: userId });
    return workspace ? workspace._id : null;
};

export const generate = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);

        if (!workspaceId) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const { inputs } = req.body;

        const guidelines = await BrandGuidelines.findOne({ workspaceId });
        const prompt = buildStoryPrompt(inputs, guidelines);
        const outputs = await generateStory(prompt);

        const story = await StoryProject.create({
            workspaceId,
            inputs,
            outputs,
            status: 'Saved' // Auto-saving for now
        });

        res.json(story);

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ message: 'Error generating story' });
    }
};

export const listStories = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(404).json({ message: 'Workspace not found' });

        const stories = await StoryProject.find({ workspaceId }).sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stories' });
    }
};

export const getStory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);

        const story = await StoryProject.findOne({ _id: req.params.id, workspaceId });
        if (!story) return res.status(404).json({ message: 'Story not found' });

        res.json(story);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching story' });
    }
};

export const deleteStory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);

        const result = await StoryProject.deleteOne({ _id: req.params.id, workspaceId });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Story not found' });

        res.json({ message: 'Story deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting story' });
    }
};

export const regenerate = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(404).json({ message: 'Workspace not found' });

        const { id } = req.params;
        const { section } = req.body; // 'hooks' | 'script' | 'titles' | 'captions'

        if (!['hooks', 'script', 'titles', 'captions'].includes(section)) {
            return res.status(400).json({ message: 'Invalid section' });
        }

        const story = await StoryProject.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs) {
            return res.status(404).json({ message: 'Story or outputs not found' });
        }

        const guidelines = await BrandGuidelines.findOne({ workspaceId });
        const prompt = buildRegeneratePrompt(story.inputs, story.outputs, section, guidelines);
        const newSectionData = await callLLMForSection<any>(prompt);

        const updatedStory = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            { $set: { [`outputs.${section}`]: newSectionData[section] } },
            { new: true }
        );

        res.json(updatedStory);

    } catch (error) {
        console.error('Regeneration error:', error);
        res.status(500).json({ message: 'Error regenerating section' });
    }
};

export const duplicateStory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(404).json({ message: 'Workspace not found' });

        const { id } = req.params;
        const originalStory = await StoryProject.findOne({ _id: id, workspaceId });
        if (!originalStory) return res.status(404).json({ message: 'Story not found' });

        const duplicatedStory = await StoryProject.create({
            workspaceId,
            inputs: {
                ...originalStory.inputs,
                topic: `${originalStory.inputs.topic} (Copy)`
            },
            outputs: originalStory.outputs,
            status: 'Draft' // Clones are drafts by default
        });

        res.json(duplicatedStory);
    } catch (error) {
        console.error('Duplication error:', error);
        res.status(500).json({ message: 'Error duplicating story' });
    }
};

export const generateArticle = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(404).json({ message: 'Workspace not found' });

        const { id } = req.params;
        const story = await StoryProject.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs) {
            return res.status(404).json({ message: 'Story or outputs not found' });
        }

        const guidelines = await BrandGuidelines.findOne({ workspaceId });
        const prompt = buildArticlePrompt(story.inputs, story.outputs, guidelines);
        const articleData = await callLLMForSection<{ article: string }>(prompt);

        const updatedStory = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            { $set: { 'outputs.article': articleData.article } },
            { new: true }
        );

        res.json(updatedStory);
    } catch (error) {
        console.error('Article generation error:', error);
        res.status(500).json({ message: 'Error generating article' });
    }
};

export const generateStoryboard = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(404).json({ message: 'Workspace not found' });

        const { id } = req.params;
        const story = await StoryProject.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs) {
            return res.status(404).json({ message: 'Story or outputs not found' });
        }

        const guidelines = await BrandGuidelines.findOne({ workspaceId });
        const prompt = buildStoryboardPrompt(story.inputs, story.outputs, guidelines);
        const storyboardData = await callLLMForSection<{ storyboard: any }>(prompt);

        const updatedStory = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            { $set: { 'outputs.storyboard': storyboardData.storyboard } },
            { new: true }
        );

        res.json(updatedStory);
    } catch (error) {
        console.error('Storyboard generation error:', error);
        res.status(500).json({ message: 'Error generating storyboard' });
    }
};

export const updateScene = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id, index } = req.params;
        const updates = req.body;

        const idx = parseInt(index);
        if (isNaN(idx)) {
            return res.status(400).json({ message: 'Invalid scene index' });
        }

        const updateKey = `outputs.storyboard.scenes.${idx}`;
        const updateObj: any = {};
        for (const [key, value] of Object.entries(updates)) {
            updateObj[`${updateKey}.${key}`] = value;
        }

        const story = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            { $set: updateObj },
            { new: true }
        );

        if (!story) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        res.json(story);
    } catch (error) {
        console.error('Update scene error:', error);
        res.status(500).json({ message: 'Error updating scene' });
    }
};

export const addScene = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id } = req.params;

        const story = await StoryProject.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs || !story.outputs.storyboard) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        const newScene = {
            sceneNumber: story.outputs.storyboard.scenes.length + 1,
            visualDescription: 'New scene description...',
            imagePrompt: 'New image prompt...',
            scriptLine: 'New script line...',
            status: SceneStatus.IDLE
        };

        story.outputs.storyboard.scenes.push(newScene);
        story.markModified('outputs.storyboard.scenes');
        await story.save();

        res.json(story);
    } catch (error) {
        console.error('Add scene error:', error);
        res.status(500).json({ message: 'Error adding scene' });
    }
};

export const removeScene = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id, index } = req.params;

        const story = await StoryProject.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs || !story.outputs.storyboard) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        const idx = parseInt(index);
        if (isNaN(idx) || idx < 0 || idx >= story.outputs.storyboard.scenes.length) {
            return res.status(400).json({ message: 'Invalid scene index' });
        }

        story.outputs.storyboard.scenes.splice(idx, 1);

        // Re-number scenes
        story.outputs.storyboard.scenes.forEach((s, i) => {
            s.sceneNumber = i + 1;
        });

        story.markModified('outputs.storyboard.scenes');
        await story.save();

        res.json(story);
    } catch (error) {
        console.error('Remove scene error:', error);
        res.status(500).json({ message: 'Error removing scene' });
    }
};

export const moveScene = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id, index } = req.params;
        const { direction } = req.body; // 'up' | 'down'

        const story = await StoryProject.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs || !story.outputs.storyboard) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        const idx = parseInt(index);
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;

        if (newIdx < 0 || newIdx >= story.outputs.storyboard.scenes.length) {
            return res.status(400).json({ message: 'Cannot move in that direction' });
        }

        // Swap
        const scenes = [...story.outputs.storyboard.scenes];
        [scenes[idx], scenes[newIdx]] = [scenes[newIdx], scenes[idx]];

        // Re-number
        scenes.forEach((s, i) => {
            s.sceneNumber = i + 1;
        });

        story.outputs.storyboard.scenes = scenes;
        story.markModified('outputs.storyboard.scenes');
        await story.save();

        res.json(story);
    } catch (error) {
        console.error('Move scene error:', error);
        res.status(500).json({ message: 'Error moving scene' });
    }
};

export const generateSceneImage = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id, index } = req.params;

        const idx = parseInt(index);
        // We still need to find it once to check if it exists and get the prompt
        const initialStory = await StoryProject.findOne({ _id: id, workspaceId });
        if (!initialStory || !initialStory.outputs || !initialStory.outputs.storyboard) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        const scene = initialStory.outputs.storyboard.scenes[idx];
        if (!scene) return res.status(404).json({ message: 'Scene not found' });

        if (!scene.imagePrompt) {
            return res.status(400).json({ message: 'Scene is missing an image prompt' });
        }

        const imageUrl = await generateImage(scene.imagePrompt);

        // Atomic update only the specific fields
        const story = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            {
                $set: {
                    [`outputs.storyboard.scenes.${idx}.imageUri`]: imageUrl,
                    [`outputs.storyboard.scenes.${idx}.status`]: 'COMPLETED'
                },
                $unset: {
                    [`outputs.storyboard.scenes.${idx}.videoUri`]: ""
                }
            },
            { new: true }
        );

        res.json(story);
    } catch (error: any) {
        console.error('Scene image generation error:', error);
        res.status(500).json({
            message: 'Error generating image',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const generateSceneAudio = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id, index } = req.params;

        const idx = parseInt(index);
        const initialStory = await StoryProject.findOne({ _id: id, workspaceId });
        if (!initialStory || !initialStory.outputs || !initialStory.outputs.storyboard) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        const scene = initialStory.outputs.storyboard.scenes[idx];
        if (!scene) return res.status(404).json({ message: 'Scene not found' });

        if (!scene.scriptLine) {
            return res.status(400).json({ message: 'Scene is missing a script line for audio' });
        }

        const { buffer, mimeType } = await generateAudio(scene.scriptLine);
        const audioBase64 = buffer.toString('base64');
        const audioUri = `data:${mimeType};base64,${audioBase64}`;

        const story = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            {
                $set: {
                    [`outputs.storyboard.scenes.${idx}.audioUri`]: audioUri,
                    [`outputs.storyboard.scenes.${idx}.status`]: 'COMPLETED'
                }
            },
            { new: true }
        );

        res.json(story);
    } catch (error: any) {
        console.error('Scene audio generation error:', error);
        res.status(500).json({
            message: 'Error generating audio',
            details: error.message
        });
    }
};

export const generateSceneVideo = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id, index } = req.params;

        const idx = parseInt(index);
        const initialStory = await StoryProject.findOne({ _id: id, workspaceId });
        if (!initialStory || !initialStory.outputs || !initialStory.outputs.storyboard) {
            return res.status(404).json({ message: 'Storyboard not found' });
        }

        const scene = initialStory.outputs.storyboard.scenes[idx];
        if (!scene) return res.status(404).json({ message: 'Scene not found' });

        if (!scene.imagePrompt && !scene.visualDescription) {
            return res.status(400).json({ message: 'Scene is missing a visual prompt or description' });
        }

        const videoUrl = await generateVideo(scene.imagePrompt || scene.visualDescription);

        const story = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            {
                $set: {
                    [`outputs.storyboard.scenes.${idx}.videoUri`]: videoUrl,
                    [`outputs.storyboard.scenes.${idx}.status`]: 'COMPLETED'
                },
                $unset: {
                    [`outputs.storyboard.scenes.${idx}.imageUri`]: ""
                }
            },
            { new: true }
        );

        res.json(story);
    } catch (error: any) {
        console.error('Scene video generation error:', error);
        res.status(500).json({
            message: 'Error generating video',
            details: error.message
        });
    }
};

export const proxyAsset = async (req: Request, res: Response) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).send('URL is required');
        }

        https.get(url, (proxyRes) => {
            // Keep basic headers
            const contentType = proxyRes.headers['content-type'];
            if (contentType) res.setHeader('Content-Type', contentType);

            // Critical: Allow CORS for the resulting stream
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=3600');

            proxyRes.pipe(res);
        }).on('error', (e) => {
            console.error('Proxy fetch error:', e);
            res.status(500).send('Error fetching asset');
        });
    } catch (error) {
        console.error('Proxy controller error:', error);
        res.status(500).send('Internal server error');
    }
};
export const updateScript = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = await getWorkspaceId(userId);
        const { id } = req.params;
        const { script } = req.body;

        if (!Array.isArray(script)) {
            return res.status(400).json({ message: 'Invalid script format. Must be an array.' });
        }

        const story = await StoryProject.findOneAndUpdate(
            { _id: id, workspaceId },
            { $set: { 'outputs.script': script } },
            { new: true }
        );

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        res.json(story);
    } catch (error) {
        console.error('Update script error:', error);
        res.status(500).json({ message: 'Error updating script' });
    }
};
