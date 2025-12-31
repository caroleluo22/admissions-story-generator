
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import type { TutorialRequest, Scene, GenerationMode, StoryStudioContent, StoryProject } from './types';
import { AppStatus, SceneStatus, AppMode } from './types';
import { hasApiKey, requestApiKey, createStory, getStory, generateTutorialVideo, generateTutorialImage, generateVoiceover, isQuotaError, generateStoryboard, mapBackendScenes } from './services/gemini';
import { InputForm } from './components/InputForm';
import { LoadingDisplay } from './components/LoadingDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Studio } from './components/Studio';
import { StoryStudio } from './components/StoryStudio';
import { Header } from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LibraryPage } from './pages/LibraryPage';
import { BrandGuidelinesPage } from './pages/BrandGuidelinesPage';
import { PreviewExportPage } from './pages/PreviewExportPage';
import { LandingPage } from './pages/LandingPage';
import TrendStudio from './pages/TrendStudio';
import WritingStudio from './pages/WritingStudio';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const VisionaryStudio = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);

  const [appMode, setAppMode] = useState<AppMode>(AppMode.TUTORIAL);
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.INPUT);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('VIDEO');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [globalError, setGlobalError] = useState<string>('');
  const navigate = useNavigate();
  //
  const { id } = useParams<{ id: string }>();
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if navigation state requests a specific mode
    if (location.state && (location.state as any).appMode) {
      setAppMode((location.state as any).appMode);
    }
  }, [location.state]);


  useEffect(() => {
    const check = async () => {
      try {
        const keyExists = await hasApiKey();
        setHasKey(keyExists);
      } catch (e) {
        console.error("Error checking API key:", e);
      } finally {
        setCheckingKey(false);
      }
    };
    check();
  }, []);

  // State to hold the full active story object
  const [activeStory, setActiveStory] = useState<StoryProject | null>(null);

  useEffect(() => {
    if (id) {
      setCurrentStoryId(id);
      loadStory(id);
    }
  }, [id]);

  const loadStory = async (storyId: string) => {
    try {
      const story = await getStory(storyId);
      setActiveStory(story);
      setCurrentStoryId(story._id!);

      // Intelligent Mode Switching
      // Check if it's a valid video project (has scenes)
      if (story.outputs?.storyboard?.scenes && story.outputs.storyboard.scenes.length > 0) {
        // It has a storyboard, so it's a Video Project
        setAppMode(AppMode.TUTORIAL);
        setScenes(mapBackendScenes(story));
        setAppStatus(AppStatus.REVIEW);
      } else if (story.outputs?.script) {
        // It has a script but no storyboard, so it's a Story Studio Project
        setAppMode(AppMode.STORY_STUDIO);
        setAppStatus(AppStatus.REVIEW);
      } else {
        // Fallback or Draft
        setAppMode(AppMode.STORY_STUDIO);
      }
    } catch (e) {
      console.error("Failed to load story", e);
      setGlobalError("Failed to load story.");
    }
  };

  const handleSelectKey = async () => {
    try {
      await requestApiKey();
      setHasKey(true);
    } catch (e) {
      console.error("Failed to select key", e);
    }
  };

  const handleGeneratePlan = async (request: TutorialRequest) => {
    setAppStatus(AppStatus.PLANNING);
    setProgressMessage('Analyzing topic and generating scene outline...');
    setGlobalError('');
    try {
      const story = await createStory(request);
      if (story._id) {
        navigate(`/studio/${story._id}`);
      } else {
        throw new Error("No ID returned from story creation");
      }
    } catch (error: any) {
      console.error("Plan generation error:", error);
      setGlobalError(error.message || 'Failed to generate plan.');
      setAppStatus(AppStatus.INPUT);
    }
  };

  const handleSendStudioToProduction = async (storyId: string) => {
    setGlobalError('');
    setProgressMessage('Converting script to storyboard scenes...');
    setAppStatus(AppStatus.PLANNING);
    // Switch to Tutorial/Video mode to show loading
    setAppMode(AppMode.TUTORIAL);

    try {
      // 1. Generate Storyboard from the Backend
      const newScenes = await generateStoryboard(storyId);

      // 2. Load Scenes and Transition
      setScenes(Array.isArray(newScenes) ? newScenes : []);
      setCurrentStoryId(storyId);
      setAppStatus(AppStatus.REVIEW);
      navigate(`/studio/${storyId}`);

    } catch (e: any) {
      console.error("Failed to generate storyboard", e);
      setGlobalError("Failed to convert story to scenes. Please try again.");
      // Go back to studio if failed
      setAppMode(AppMode.STORY_STUDIO);
    }
  };

  const handleUpdateScene = (id: string, field: keyof Scene, value: string) => {
    setScenes(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.map(s => s.id === id ? { ...s, [field]: value } : s);
    });
  };

  const handleRemoveScene = (id: string) => setScenes(prev => Array.isArray(prev) ? prev.filter(s => s.id !== id) : []);
  const handleAddScene = () => setScenes(prev => Array.isArray(prev) ? [...prev, { id: `scene-${Date.now()}`, title: `New Scene`, script: '', visualPrompt: '', status: SceneStatus.IDLE }] : []);

  const handleMoveScene = (id: string, direction: 'up' | 'down') => {
    setScenes(prev => {
      if (!Array.isArray(prev)) return [];
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const newScenes = [...prev];
      if (direction === 'up' && index > 0) [newScenes[index], newScenes[index - 1]] = [newScenes[index - 1], newScenes[index]];
      else if (direction === 'down' && index < prev.length - 1) [newScenes[index], newScenes[index + 1]] = [newScenes[index + 1], newScenes[index]];
      return newScenes;
    });
  };

  const generateMediaForScene = async (sceneId: string, mode: GenerationMode): Promise<boolean> => {
    if (!currentStoryId) {
      setGlobalError("No active story. Please save first.");
      return false;
    }
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return false;

    const scene = scenes[sceneIndex];
    if (!scene) return false;

    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: SceneStatus.GENERATING, error: undefined } : s));

    let audioResult: string | undefined = undefined;
    let visualResult: string | undefined = undefined;

    // Generate Audio
    try {
      if (!scene.audioUri) {
        audioResult = await generateVoiceover(currentStoryId, sceneIndex);
      } else {
        audioResult = scene.audioUri;
      }
    } catch (e) { console.error("Audio generation failed", e); }

    // Generate Visuals
    try {
      if (mode === 'VIDEO') {
        visualResult = await generateTutorialVideo(currentStoryId, sceneIndex);
        // Backend returns the URI
      } else {
        visualResult = await generateTutorialImage(currentStoryId, sceneIndex);
      }
    } catch (videoError: any) {
      if (mode === 'VIDEO' && isQuotaError(videoError)) {
        setGlobalError("Video quota exceeded. Switching to Storyboard Mode.");
        setGenerationMode('IMAGE');
        return await generateMediaForScene(sceneId, 'IMAGE');
      }
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: SceneStatus.ERROR, error: `Failed to generate ${mode.toLowerCase()}.` } : s));
      return false;
    }

    // Update local state with results
    setScenes(prev => prev.map(s => s.id === sceneId ? {
      ...s,
      status: SceneStatus.COMPLETED,
      videoUri: mode === 'VIDEO' ? visualResult : undefined,
      imageUri: mode === 'IMAGE' ? visualResult : undefined,
      audioUri: audioResult || s.audioUri
    } : s));
    return false;
  };

  const handleGenerateSingleScene = async (id: string) => generateMediaForScene(id, generationMode);

  const handleStartProduction = async () => {
    setAppStatus(AppStatus.PRODUCTION);
    setGlobalError('');
    let currentMode = generationMode;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.status === SceneStatus.GENERATING || (currentMode === 'VIDEO' && scene.videoUri) || (currentMode === 'IMAGE' && scene.imageUri)) continue;
      if (i > 0) await new Promise(resolve => setTimeout(resolve, currentMode === 'VIDEO' ? 5000 : 1000));
      const fallbackOccurred = await generateMediaForScene(scene.id, currentMode);
      if (fallbackOccurred) currentMode = 'IMAGE';
    }
  };

  const reset = () => {
    if (window.confirm("Start over? Unsaved work will be lost.")) {
      setAppStatus(AppStatus.INPUT);
      setScenes([]);
      setGlobalError('');
      navigate('/studio');
    }
  };

  if (checkingKey) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white selection:bg-indigo-500 selection:text-white">
      {!hasKey && <ApiKeyModal onSelectKey={handleSelectKey} />}

      <Header appMode={appMode} setAppMode={setAppMode} setAppStatus={setAppStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {globalError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-8 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-red-200 font-medium">{globalError}</div>
          </div>
        )}

        {appMode === AppMode.STORY_STUDIO ? (
          <StoryStudio
            onSendToProduction={handleSendStudioToProduction}
            initialStory={activeStory}
            prefilledInputs={
              // Extract prefilled data from location state if available
              location.state && (location.state as any).prefilledTopic ? {
                topic: (location.state as any).prefilledTopic,
                audience: (location.state as any).prefilledAudience,
                platform: (location.state as any).prefilledPlatform
              } : undefined
            }
          />
        ) : (
          <>
            {appStatus === AppStatus.INPUT && (
              <div className="animate-fade-in-up">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                    Turn concepts into <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                      cinematic videos.
                    </span>
                  </h1>
                </div>
                <InputForm onSubmit={handleGeneratePlan} disabled={false} />
              </div>
            )}

            {appStatus === AppStatus.PLANNING && <LoadingDisplay message={progressMessage} />}

            {(appStatus === AppStatus.REVIEW || appStatus === AppStatus.PRODUCTION) && (
              <Studio
                scenes={scenes}
                appStatus={appStatus}
                generationMode={generationMode}
                onSetGenerationMode={setGenerationMode}
                onUpdateScene={handleUpdateScene}
                onRemoveScene={handleRemoveScene}
                onAddScene={handleAddScene}
                onMoveScene={handleMoveScene}
                onGenerateScene={handleGenerateSingleScene}
                onGenerateAll={handleStartProduction}
                onReset={reset}
                storyId={currentStoryId}
                onViewScript={() => setAppMode(AppMode.STORY_STUDIO)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/studio" element={<ProtectedRoute><VisionaryStudio /></ProtectedRoute>} />
          <Route path="/studio/new" element={<ProtectedRoute><VisionaryStudio /></ProtectedRoute>} />
          <Route path="/studio/:id" element={<ProtectedRoute><VisionaryStudio /></ProtectedRoute>} />
          <Route path="/studio/:id/export" element={<ProtectedRoute><PreviewExportPage /></ProtectedRoute>} />
          <Route path="/trend-studio" element={<ProtectedRoute><TrendStudio /></ProtectedRoute>} />
          <Route path="/writing" element={<ProtectedRoute><WritingStudio /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/brand" element={<ProtectedRoute><BrandGuidelinesPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
