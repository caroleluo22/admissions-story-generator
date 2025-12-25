import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
    name: string;
    ownerId: mongoose.Types.ObjectId;
}

const WorkspaceSchema: Schema = new Schema({
    name: { type: String, required: true, default: 'My Channel' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
