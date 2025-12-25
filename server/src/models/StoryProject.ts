import mongoose, { Document, Schema } from 'mongoose';
import { StoryInputs, StoryOutputs } from '../../../shared/types/story';

export interface IStoryProject extends Document {
    workspaceId: mongoose.Types.ObjectId;
    inputs: StoryInputs;
    outputs?: StoryOutputs;
    status: 'Draft' | 'Saved' | 'Archived';
}

const StoryProjectSchema: Schema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
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
                id: String,
                sceneNumber: Number,
                title: String,
                visualDescription: String,
                imagePrompt: String,
                scriptLine: String,
                videoUri: String,
                imageUri: String,
                audioUri: String,
                status: { type: String, default: 'IDLE' }
            }]
        }
    },
    status: { type: String, enum: ['Draft', 'Saved', 'Archived'], default: 'Draft' },
}, { timestamps: true });

export default mongoose.model<IStoryProject>('StoryProject', StoryProjectSchema);
