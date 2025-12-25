import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scene, AppStatus, SceneStatus, GenerationMode } from '../types';
import { SceneItem } from './SceneItem';

interface StudioProps {
  scenes: Scene[];
  appStatus: AppStatus;
  generationMode: GenerationMode;
  onSetGenerationMode: (mode: GenerationMode) => void;
  onUpdateScene: (id: string, field: keyof Scene, value: string) => void;
  onRemoveScene: (id: string) => void;
  onAddScene: () => void;
  onMoveScene: (id: string, direction: 'up' | 'down') => void;
  onGenerateScene: (id: string) => void;
  onGenerateAll: () => void;
  onReset: () => void;
  onViewScript: () => void;
  storyId: string | null;
}

export const Studio: React.FC<StudioProps> = ({
  scenes,
  appStatus,
  generationMode,
  onSetGenerationMode,
  onUpdateScene,
  onRemoveScene,
  onAddScene,
  onMoveScene,
  onGenerateScene,
  onGenerateAll,
  onReset,
  onViewScript,
  storyId
}) => {
  const navigate = useNavigate();
  const isEditable = appStatus === AppStatus.REVIEW;
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const allCompleted = safeScenes.every(s => s.status === SceneStatus.COMPLETED || s.status === SceneStatus.ERROR);
  const hasVideos = safeScenes.some(s => s.videoUri || s.imageUri);

  const handlePreview = () => {
    if (storyId) {
      navigate(`/studio/${storyId}/export`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-20 relative">


      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEditable ? 'Review & Edit Your Plan' : 'Production Studio'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Verify the scripts and visual prompts before generating media.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={onViewScript}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium border border-slate-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            View Script
          </button>

          {hasVideos && (
            <button
              onClick={handlePreview}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              Preview & Export
            </button>
          )}
          {allCompleted && (
            <button onClick={onReset} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium border border-slate-700">
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher */}
      {isEditable && (
        <div className="mb-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-white font-medium text-sm">Generation Mode</h3>
            <p className="text-slate-400 text-xs">Choose between full cinematic video or fast storyboards.</p>
          </div>
          <div className="bg-slate-800 p-1 rounded-lg inline-flex">
            <button
              onClick={() => onSetGenerationMode('VIDEO')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${generationMode === 'VIDEO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Video (Veo)
            </button>
            <button
              onClick={() => onSetGenerationMode('IMAGE')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${generationMode === 'IMAGE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Storyboard
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {safeScenes.map((scene, index) => (
          <SceneItem
            key={scene.id}
            index={index}
            scene={scene}
            isEditable={isEditable}
            isFirst={index === 0}
            isLast={index === safeScenes.length - 1}
            generationMode={generationMode}
            onUpdate={onUpdateScene}
            onRemove={onRemoveScene}
            onMove={onMoveScene}
            onGenerate={onGenerateScene}
          />
        ))}

        {isEditable && (
          <button
            onClick={onAddScene}
            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all flex items-center justify-center font-medium gap-2 group"
          >
            Add New Scene
          </button>
        )}
      </div>

      {isEditable && safeScenes.length > 0 && (
        <div className="sticky bottom-6 mt-8 flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-2xl flex gap-4">
            <button onClick={onReset} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium">
              Cancel
            </button>
            <button
              onClick={onGenerateAll}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r text-white font-bold shadow-lg flex items-center gap-2 ${generationMode === 'VIDEO' ? 'from-indigo-600 to-violet-600 shadow-indigo-500/25' : 'from-emerald-600 to-teal-600 shadow-emerald-500/25'
                }`}
            >
              {generationMode === 'VIDEO' ? 'Generate All Videos' : 'Generate All Storyboards'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};