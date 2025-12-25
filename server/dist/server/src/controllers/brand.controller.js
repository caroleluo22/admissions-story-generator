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
exports.updateGuidelines = exports.getGuidelines = void 0;
const BrandGuidelines_1 = __importDefault(require("../models/BrandGuidelines"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
// Helper to get workspace ID from user ID (assuming 1 workspace per user for v1)
// In a real app, workspaceId would likely come from a header or the user context if multi-tenant
const getWorkspaceId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield Workspace_1.default.findOne({ ownerId: userId });
    return workspace ? workspace._id : null;
});
const getGuidelines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore - user is attached by auth middleware
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        let guidelines = yield BrandGuidelines_1.default.findOne({ workspaceId });
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
    }
    catch (error) {
        console.error('Get guidelines error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getGuidelines = getGuidelines;
const updateGuidelines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const workspaceId = yield getWorkspaceId(userId);
        if (!workspaceId) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        const { toneOfVoice, bannedTerms, defaultDisclaimer, defaultLinks } = req.body;
        const guidelines = yield BrandGuidelines_1.default.findOneAndUpdate({ workspaceId }, {
            workspaceId,
            toneOfVoice,
            bannedTerms,
            defaultDisclaimer,
            defaultLinks
        }, { new: true, upsert: true, setDefaultsOnInsert: true });
        res.json(guidelines);
    }
    catch (error) {
        console.error('Update guidelines error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateGuidelines = updateGuidelines;
