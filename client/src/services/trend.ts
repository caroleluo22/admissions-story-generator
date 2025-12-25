import api from './api';
import { AnalysisReport, SocialPost, LeadProfile, Platform } from '../types/trend';

export const analyzeBusinessTrends = async (businessName: string, platform: Platform): Promise<AnalysisReport> => {
    const response = await api.post('/trends/analyze', { businessName, platform });
    return response.data;
};

export const getTopicDeepDive = async (businessName: string, platform: Platform, topic: string): Promise<SocialPost[]> => {
    const response = await api.post('/trends/deep-dive', { businessName, platform, topic });
    return response.data;
};

export const generatePostLeads = async (businessName: string, platform: Platform, content: string, url?: string): Promise<LeadProfile[]> => {
    const response = await api.post('/trends/leads', { businessName, platform, content, url });
    return response.data;
};
