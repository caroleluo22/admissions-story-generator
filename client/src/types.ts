
export interface TutorialRequest {
  topic: string;
  description: string;
  audience: string;
}

export const SceneStatus = {
  IDLE: 'IDLE',
  GENERATING: 'GENERATING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
} as const;

export type SceneStatus = typeof SceneStatus[keyof typeof SceneStatus];

export type GenerationMode = 'VIDEO' | 'IMAGE';

export interface Scene {
  id: string;
  sceneNumber?: number; // Added for compatibility
  title: string;
  script: string; // This maps to scriptLine in backend
  visualPrompt: string; // This maps to imagePrompt/visualDescription
  status: SceneStatus;
  videoUri?: string;
  imageUri?: string;
  audioUri?: string;
  error?: string;
}

export const AppStatus = {
  INPUT: 'INPUT',
  PLANNING: 'PLANNING',
  REVIEW: 'REVIEW',
  PRODUCTION: 'PRODUCTION',
} as const;

export type AppStatus = typeof AppStatus[keyof typeof AppStatus];

export const AppMode = {
  TUTORIAL: 'TUTORIAL',
  STORY_STUDIO: 'STORY_STUDIO'
} as const;

export type AppMode = typeof AppMode[keyof typeof AppMode];

// Story Studio Types
export interface StoryStudioInput {
  audience: 'Student' | 'Parent';
  platform: 'YouTube Long' | 'Shorts';
  length: '30s' | '60s' | '3-5min';
  storyType: 'Policy confusion' | 'Myth-busting' | 'Deadline horror story' | 'Essay mistake' | 'Parent reassurance' | 'Product demo';
  tone: 'Calm' | 'Urgent' | 'Authoritative' | 'Friendly';
  topic: string;
  sourceText?: string;
  ctaStyle: 'Soft' | 'Direct' | 'None';
}

export interface StoryStudioContent {
  hooks: string[];
  script: { heading: string; content: string }[];
  captions: string[];
  titles: string[];
  descriptionTemplate: string;
}

// --- Auth Types ---

export interface User {
  id: string;
  name: string;
  email: string;
  workspaceId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --- Backend Data Models ---

export interface StoryInputs {
  topic: string;
  audience: string;
  platform: string;
  length: string;
  storyType: string;
  tone: string;
  ctaStyle: string;
  sourceMaterial?: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  title?: string;
  visualDescription: string;
  imagePrompt: string;
  scriptLine: string;
  videoUri?: string;
  imageUri?: string;
  audioUri?: string;
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'ERROR';
}

export interface StoryOutputs {
  hooks?: string[];
  script?: { heading: string; content: string }[];
  titles?: string[];
  captions?: string[];
  emailDraft?: string;
  socialPosts?: string[];
  storyboard?: {
    scenes: StoryboardScene[];
  };
  article?: {
    title: string;
    content: string;
    seoDescription: string;
    keywords: string[];
  };
}

export interface StoryProject {
  _id?: string;
  userId: string;
  workspaceId: string;
  inputs: StoryInputs;
  outputs?: StoryOutputs;
  status: 'Draft' | 'Saved' | 'Archived';
  createdAt?: Date;
  updatedAt?: Date;
}