"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStoryboard = exports.generateArticle = exports.duplicateStory = exports.regenerate = exports.deleteStory = exports.getStory = exports.listStories = exports.generate = void 0;
const BrandGuidelines_1 = __importDefault(require("../models/BrandGuidelines"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const StoryProject_1 = __importDefault(require("../models/StoryProject"));
const promptBuilder_service_1 = require("../services/promptBuilder.service");
const llm_service_1 = require("../services/llm.service");
const getWorkspaceId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield Workspace_1.default.findOne({ ownerId: userId });
    return workspace ? workspace._id : null;
});
const generate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        const { inputs } = req.body;
        const guidelines = yield BrandGuidelines_1.default.findOne({ workspaceId });
        const prompt = (0, promptBuilder_service_1.buildStoryPrompt)(inputs, guidelines);
        const outputs = yield (0, llm_service_1.generateStory)(prompt);
        const story = yield StoryProject_1.default.create({
            workspaceId,
            inputs,
            outputs,
            status: 'Saved' // Auto-saving for now
        });
        res.json(story);
    }
    catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ message: 'Error generating story' });
    }
});
exports.generate = generate;
const listStories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId)
            return res.status(404).json({ message: 'Workspace not found' });
        const stories = yield StoryProject_1.default.find({ workspaceId }).sort({ createdAt: -1 });
        res.json(stories);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching stories' });
    }
});
exports.listStories = listStories;
const getStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        const story = yield StoryProject_1.default.findOne({ _id: req.params.id, workspaceId });
        if (!story)
            return res.status(404).json({ message: 'Story not found' });
        res.json(story);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching story' });
    }
});
exports.getStory = getStory;
const deleteStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        const result = yield StoryProject_1.default.deleteOne({ _id: req.params.id, workspaceId });
        if (result.deletedCount === 0)
            return res.status(404).json({ message: 'Story not found' });
        res.json({ message: 'Story deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting story' });
    }
});
exports.deleteStory = deleteStory;
const regenerate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId)
            return res.status(404).json({ message: 'Workspace not found' });
        const { id } = req.params;
        const { section } = req.body; // 'hooks' | 'script' | 'titles' | 'captions'
        if (!['hooks', 'script', 'titles', 'captions'].includes(section)) {
            return res.status(400).json({ message: 'Invalid section' });
        }
        const story = yield StoryProject_1.default.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs) {
            return res.status(404).json({ message: 'Story or outputs not found' });
        }
        const guidelines = yield BrandGuidelines_1.default.findOne({ workspaceId });
        const prompt = (0, promptBuilder_service_1.buildRegeneratePrompt)(story.inputs, story.outputs, section, guidelines);
        const newSectionData = yield (0, llm_service_1.regenerateSection)(prompt);
        // Update only the specific section
        story.outputs = Object.assign(Object.assign({}, story.outputs), { [section]: newSectionData[section] });
        yield story.save();
        res.json(story);
    }
    catch (error) {
        console.error('Regeneration error:', error);
        res.status(500).json({ message: 'Error regenerating section' });
    }
});
exports.regenerate = regenerate;
const duplicateStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId)
            return res.status(404).json({ message: 'Workspace not found' });
        const { id } = req.params;
        const originalStory = yield StoryProject_1.default.findOne({ _id: id, workspaceId });
        if (!originalStory)
            return res.status(404).json({ message: 'Story not found' });
        const duplicatedStory = yield StoryProject_1.default.create({
            workspaceId,
            inputs: Object.assign(Object.assign({}, originalStory.inputs), { topic: `${originalStory.inputs.topic} (Copy)` }),
            outputs: originalStory.outputs,
            status: 'Draft' // Clones are drafts by default
        });
        res.json(duplicatedStory);
    }
    catch (error) {
        console.error('Duplication error:', error);
        res.status(500).json({ message: 'Error duplicating story' });
    }
});
exports.duplicateStory = duplicateStory;
const generateArticle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId)
            return res.status(404).json({ message: 'Workspace not found' });
        const { id } = req.params;
        const story = yield StoryProject_1.default.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs) {
            return res.status(404).json({ message: 'Story or outputs not found' });
        }
        const guidelines = yield BrandGuidelines_1.default.findOne({ workspaceId });
        const prompt = (0, promptBuilder_service_1.buildArticlePrompt)(story.inputs, story.outputs, guidelines);
        const articleData = yield (0, llm_service_1.regenerateSection)(prompt);
        story.outputs.article = articleData.article;
        yield story.save();
        res.json(story);
    }
    catch (error) {
        console.error('Article generation error:', error);
        res.status(500).json({ message: 'Error generating article' });
    }
});
exports.generateArticle = generateArticle;
const generateStoryboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId)
            return res.status(404).json({ message: 'Workspace not found' });
        const { id } = req.params;
        const story = yield StoryProject_1.default.findOne({ _id: id, workspaceId });
        if (!story || !story.outputs) {
            return res.status(404).json({ message: 'Story or outputs not found' });
        }
        const guidelines = yield BrandGuidelines_1.default.findOne({ workspaceId });
        const prompt = (0, promptBuilder_service_1.buildStoryboardPrompt)(story.inputs, story.outputs, guidelines);
        const storyboardData = yield (0, llm_service_1.regenerateSection)(prompt);
        story.outputs.storyboard = storyboardData.storyboard;
        yield story.save();
        res.json(story);
    }
    catch (error) {
        console.error('Storyboard generation error:', error);
        res.status(500).json({ message: 'Error generating storyboard' });
    }
});
exports.generateStoryboard = generateStoryboard;
