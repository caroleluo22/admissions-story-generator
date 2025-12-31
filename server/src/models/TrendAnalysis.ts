import mongoose from 'mongoose';

const trendAnalysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

trendAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const TrendAnalysis = mongoose.model('TrendAnalysis', trendAnalysisSchema);
