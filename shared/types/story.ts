export type Audience = 'Student' | 'Parent';
export type Platform = 'YouTube Long' | 'Shorts';
export type Length = '30s' | '60s' | '3-5min';
export type Tone = 'Calm' | 'Urgent' | 'Authoritative' | 'Friendly';

export interface StoryInputs {
    audience: Audience;
    platform: Platform;
    length: Length;
    storyType: string;
    tone: Tone;
    topic: string;
    sourceMaterial?: string;
    strictMode?: boolean;
    ctaStyle: 'Soft' | 'Direct' | 'None';
}

export interface StorySection {
    heading: string;
    content: string;
    visualCue?: string;
}

export enum SceneStatus {
    IDLE = 'IDLE',
    GENERATING = 'GENERATING',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
}

export interface StoryboardScene {
    id?: string;
    sceneNumber: number;
    title?: string;
    visualDescription: string;
    imagePrompt: string;
    scriptLine: string;
    videoUri?: string;
    imageUri?: string;
    audioUri?: string;
    status?: SceneStatus;
}

export interface StoryOutputs {
    hooks: string[];
    script: StorySection[];
    captions: string[];
    titles: string[];
    description: string;
    article?: string;
    storyboard?: {
        characters: { name: string; description: string; prompt: string }[];
        scenes: StoryboardScene[];
    };
}

export interface StoryProject {
    _id?: string;
    workspaceId: string;
    inputs: StoryInputs;
    outputs?: StoryOutputs;
    status: 'Draft' | 'Saved' | 'Archived';
    createdAt?: string;
    updatedAt?: string;
}
