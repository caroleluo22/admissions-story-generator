import api from './api';
import type { TutorialRequest, Scene, StoryProject, StoryboardScene } from "../types";
import { SceneStatus } from "../types";

// Mock API Key check as server handles it
export const hasApiKey = async (): Promise<boolean> => true;
export const requestApiKey = async (): Promise<void> => { };

// Helper to map backend scenes to frontend Scene type
export const mapBackendScenes = (story: StoryProject): Scene[] => {
  if (!story.outputs?.storyboard?.scenes) return [];
  return story.outputs.storyboard.scenes.map((s: StoryboardScene, i: number) => ({
    id: `scene-${i}`, // Use index as ID for now or a reliable stable ID if available
    sceneNumber: s.sceneNumber,
    title: s.title || `Scene ${s.sceneNumber}`,
    script: s.scriptLine,
    visualPrompt: s.imagePrompt || s.visualDescription,
    status: s.status as SceneStatus,
    videoUri: s.videoUri,
    imageUri: s.imageUri,
    audioUri: s.audioUri
  }));
};

export const createStory = async (input: TutorialRequest): Promise<StoryProject> => {
  // Map TutorialRequest to StoryInputs
  const payload = {
    topic: input.topic,
    audience: input.audience || 'General',
    platform: 'YouTube',
    length: '3-5min',
    storyType: input.storyType || 'Educational',
    tone: 'Informative',
    ctaStyle: 'Soft',
    sourceMaterial: input.description,
    // strictMode removed in favor of storyType
  };
  const res = await api.post('/stories/generate', { inputs: payload });
  return res.data;
};

// IMPORTANT: Returns full story project now, caller must handle scene mapping if needed
export const getStory = async (id: string): Promise<StoryProject> => {
  const res = await api.get(`/stories/${id}`);
  return res.data;
};

export const listStories = async (): Promise<StoryProject[]> => {
  const res = await api.get('/stories');
  return res.data;
};

export const createFullStory = async (input: any): Promise<StoryProject> => {
  const payload = {
    ...input,
    sourceMaterial: input.sourceText // Map sourceText to sourceMaterial
  };
  const res = await api.post('/stories/generate', { inputs: payload });
  return res.data;
};

export const generateStoryboard = async (storyId: string): Promise<Scene[]> => {
  const res = await api.post(`/stories/${storyId}/storyboard`);
  return mapBackendScenes(res.data);
};

export const generateArticle = async (storyId: string): Promise<string> => {
  const res = await api.post(`/stories/${storyId}/article`);
  return res.data.outputs.article;
};

export const updateScript = async (storyId: string, script: { heading: string; content: string }[]): Promise<any> => {
  const res = await api.put(`/stories/${storyId}/script`, { script });
  return res.data;
};

// Legacy shim for App.tsx compatibility - replaced by createStory usage in App.tsx
export const generateTutorialPlan = async (_request: TutorialRequest): Promise<Scene[]> => {
  throw new Error("Use createStory instead");
};

export const generateSceneMedia = async (storyId: string, sceneIndex: number, type: 'video' | 'image' | 'audio'): Promise<string | undefined> => {
  const res = await api.post(`/stories/${storyId}/scenes/${sceneIndex}/${type}`);
  // The backend returns the updated Story. We need to extract the new URI.
  const updatedScene = res.data.outputs.storyboard.scenes[sceneIndex];
  if (type === 'video') return updatedScene.videoUri;
  if (type === 'image') return updatedScene.imageUri;
  if (type === 'audio') return updatedScene.audioUri;
  return undefined;
};

// Wrappers for App.tsx
export const generateVoiceover = async (storyId: string, sceneIndex: number): Promise<string | undefined> => {
  return generateSceneMedia(storyId, sceneIndex, 'audio');
};

export const generateTutorialImage = async (storyId: string, sceneIndex: number): Promise<string | undefined> => {
  return generateSceneMedia(storyId, sceneIndex, 'image');
};

export const generateTutorialVideo = async (storyId: string, sceneIndex: number): Promise<string | undefined> => {
  return generateSceneMedia(storyId, sceneIndex, 'video');
};

export const fetchAuthenticatedVideoUrl = async (uri: string): Promise<string> => {
  // Basic pass-through or blob fetch if needed. 
  // Since we use api.ts interceptors, we might need a specific fetcher if it's a protected route.
  // But our videoUri is usually a public URL or a signed URL. 
  // If it is a proxy url '/api/proxy...', we use api.get set responseType blob.
  if (uri.startsWith('http')) return uri; // Assume direct link is accessible or handled
  // If it's a relative path to our proxy
  const res = await api.get(uri, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
};

export const isQuotaError = (error: any): boolean => {
  return error.response?.status === 429;
};

export const analyzeVideoContent = async (url: string): Promise<string> => {
  const res = await api.post('/stories/analyze-video', { url });
  return res.data.analysis;
};

export const updateArticle = async (storyId: string, article: string): Promise<StoryProject> => {
  const res = await api.put(`/stories/${storyId}/article`, { article });
  return res.data;
};

export const generateVisualPromptsForScript = async (_script: any): Promise<Scene[]> => {
  // This was for "Story Studio" mode. 
  // We should probably implement a backend endpoint for this or reuse generateStory with specific inputs.
  // For now, throw error or implement calls
  throw new Error("Story Studio mode backend integration pending");
};
