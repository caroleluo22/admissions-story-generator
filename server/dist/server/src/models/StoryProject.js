"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const StoryProjectSchema = new mongoose_1.Schema({
    workspaceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    inputs: {
        audience: { type: String, required: true },
        platform: { type: String, required: true },
        length: { type: String, required: true },
        storyType: { type: String, required: true },
        tone: { type: String, required: true },
        topic: { type: String, required: true },
        sourceMaterial: { type: String },
        ctaStyle: { type: String, required: true },
    },
    outputs: {
        hooks: [String],
        script: [{
                heading: String,
                content: String,
                visualCue: String
            }],
        captions: [String],
        titles: [String],
        description: String,
        article: String,
        storyboard: {
            characters: [{
                    name: String,
                    description: String,
                    prompt: String
                }],
            scenes: [{
                    sceneNumber: Number,
                    visualDescription: String,
                    imagePrompt: String,
                    scriptLine: String
                }]
        }
    },
    status: { type: String, enum: ['Draft', 'Saved', 'Archived'], default: 'Draft' },
}, { timestamps: true });
exports.default = mongoose_1.default.model('StoryProject', StoryProjectSchema);
