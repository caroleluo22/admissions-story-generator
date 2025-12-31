export interface TrendDataPoint {
    date: string;
    interestScore: number;
    sentimentScore: number; // -100 to 100
}

export interface TopicBubble {
    name: string;
    value: number; // Popularity/Volume
    category: string;
}

export interface Persona {
    name: string;
    description: string;
    painPoints: string[];
    interests: string[];
}

export interface AnalysisReport {
    businessName: string;
    executiveSummary: string;
    trendHistory: TrendDataPoint[];
    topics: TopicBubble[];
    audience: Persona[];
    sources: Array<{ title: string; uri: string }>;
}

export interface LeadProfile {
    handle: string;
    persona: string;
    intent: string; // Why they are interested
    buyingSignal: 'High' | 'Medium' | 'Low';
    commentSnippet: string; // The specific comment they left
    isReal?: boolean; // True if extracted from real search results
}

export interface SocialPost {
    type: string; // 'Video', 'Tweet', 'Reel', 'Post'
    content: string;
    author: string;
    url: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    likes: string;
    views: string;
    comments: string;
    shares: string;
    leads?: LeadProfile[]; // AI-inferred potential customers
}

export type Platform = 'youtube' | 'instagram' | 'facebook' | 'x';

export enum TrendAppStatus {
    IDLE = 'IDLE',
    ANALYZING_SEARCH = 'ANALYZING_SEARCH',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
}

export interface TrendHistoryItem {
    _id: string;
    businessName: string;
    platform: Platform;
    createdAt: string;
}

export interface StorySuggestion {
    angle: string;
    title: string;
    hook: string;
    summary: string;
    prompt: string;
}
