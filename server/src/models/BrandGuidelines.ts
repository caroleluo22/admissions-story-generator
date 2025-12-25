import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandGuidelines extends Document {
    workspaceId: mongoose.Types.ObjectId;
    toneOfVoice: string;
    bannedTerms: string[];
    defaultDisclaimer: string;
    defaultLinks: string;
}

const BrandGuidelinesSchema: Schema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    toneOfVoice: { type: String, default: '' },
    bannedTerms: { type: [String], default: [] },
    defaultDisclaimer: { type: String, default: '' },
    defaultLinks: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IBrandGuidelines>('BrandGuidelines', BrandGuidelinesSchema);
