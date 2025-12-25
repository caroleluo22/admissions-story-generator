import React from 'react';
import { Scene, SceneStatus, GenerationMode } from '../types';

interface SceneItemProps {
  scene: Scene;
  index: number;
  isEditable: boolean;
  isFirst: boolean;
  isLast: boolean;
  generationMode: GenerationMode;
  onUpdate: (id: string, field: keyof Scene, value: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onGenerate: (id: string) => void;
}

export const SceneItem: React.FC<SceneItemProps> = ({ 
  scene, 
  index, 
  isEditable, 
  isFirst, 
  isLast, 
  generationMode,
  onUpdate, 
  onRemove, 
  onMove,
  onGenerate
}) => {
  
  const handleDownload = () => {
    const uri = scene.videoUri || scene.imageUri;
    const extension = scene.videoUri ? 'mp4' : 'png';
    
    if (uri) {
      const a = document.createElement('a');
      a.href = uri;
      a.download = `${scene.title.replace(/\s+/g, '_')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const hasMedia = !!(scene.videoUri || scene.imageUri);
  const hasAudio = !!scene.audioUri;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden transition-all hover:border-slate-600 mb-6 shadow-lg">
      <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 flex-grow mr-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs text-slate-300 flex-shrink-0">
            {index + 1}
          </span>
          {isEditable ? (
            <input
              type="text"
              value={scene.title}
              onChange={(e) => onUpdate(scene.id, 'title', e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white font-semibold placeholder-slate-500 w-full"
            />
          ) : (
            <span className="truncate">{scene.title}</span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          {isEditable && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 p-0.5 mr-2">
              <button
                onClick={() => onMove(scene.id, 'up')}
                disabled={isFirst}
                className={`p-1.5 rounded-md transition-colors ${isFirst ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                title="Move Scene Up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => onMove(scene.id, 'down')}
                disabled={isLast}
                className={`p-1.5 rounded-md transition-colors ${isLast ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                title="Move Scene Down"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {isEditable && (
            <button 
              onClick={() => onRemove(scene.id)}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
              title="Remove Scene"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.636-1.452ZM12.9 8.16a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V8.91a.75.75 0 0 1 .75-.75ZM9 8.16a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V8.91a.75.75 0 0 1 .75-.75ZM9 14.16a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0v-3.75a.75.75 0 0 1 .75-.75ZM12.9 14.16a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0v-3.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Script & Prompt inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              Narration Script
            </label>
            <textarea
              value={scene.script}
              onChange={(e) => onUpdate(scene.id, 'script', e.target.value)}
              disabled={!isEditable}
              rows={3}
              className={`w-full bg-slate-900 border ${isEditable ? 'border-slate-600 focus:border-indigo-500' : 'border-slate-800'} rounded-lg p-3 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 transition-all resize-none`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Visual Prompt
            </label>
            <textarea
              value={scene.visualPrompt}
              onChange={(e) => onUpdate(scene.id, 'visualPrompt', e.target.value)}
              disabled={!isEditable}
              rows={3}
              className={`w-full bg-slate-900 border ${isEditable ? 'border-slate-600 focus:border-indigo-500' : 'border-slate-800'} rounded-lg p-3 text-sm text-slate-400 italic focus:ring-1 focus:ring-indigo-500 transition-all resize-none`}
            />
          </div>
        </div>

        {/* Right Col: Preview / Status */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-slate-800 group">
          {scene.status === SceneStatus.IDLE && (
            <div className="flex flex-col items-center justify-center gap-4">
               <div className="text-slate-600 text-sm flex flex-col items-center">
                 {generationMode === 'VIDEO' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 opacity-50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                   </svg>
                 ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 opacity-50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                   </svg>
                 )}
                 <span>Ready to generate</span>
               </div>
               <button
                 onClick={() => onGenerate(scene.id)}
                 className={`px-4 py-2 ${generationMode === 'VIDEO' ? 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400' : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400'} hover:text-white border ${generationMode === 'VIDEO' ? 'border-indigo-600/50' : 'border-emerald-600/50'} rounded-lg text-sm font-medium transition-all`}
               >
                 Generate {generationMode === 'VIDEO' ? 'Video' : 'Image'}
               </button>
            </div>
          )}
          
          {scene.status === SceneStatus.GENERATING && (
            <div className="flex flex-col items-center space-y-3">
               <div className={`w-8 h-8 border-2 ${generationMode === 'VIDEO' ? 'border-indigo-500' : 'border-emerald-500'} border-t-transparent rounded-full animate-spin`}></div>
               <span className={`${generationMode === 'VIDEO' ? 'text-indigo-400' : 'text-emerald-400'} text-xs animate-pulse`}>
                 {generationMode === 'VIDEO' ? 'Rendering Video...' : 'Creating Image...'}
               </span>
            </div>
          )}

          {scene.status === SceneStatus.COMPLETED && scene.videoUri && (
            <video 
              src={scene.videoUri} 
              controls 
              className="w-full h-full object-contain" 
            />
          )}

          {scene.status === SceneStatus.COMPLETED && scene.imageUri && !scene.videoUri && (
             <img 
               src={scene.imageUri} 
               alt={scene.title}
               className="w-full h-full object-contain"
             />
          )}
          
          {/* Regeneration overlay */}
          {scene.status === SceneStatus.COMPLETED && (
            <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onGenerate(scene.id)}
                className="bg-slate-900/80 backdrop-blur text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
                title={`Regenerate ${generationMode === 'VIDEO' ? 'Video' : 'Image'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          )}

          {/* Audio Indicator Icon (Bottom Left) */}
          {scene.status === SceneStatus.COMPLETED && hasAudio && (
             <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white/80 text-xs font-mono pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
                <span>VO Ready</span>
             </div>
          )}

          {scene.status === SceneStatus.ERROR && (
             <div className="text-red-400 text-xs px-4 text-center flex flex-col items-center gap-3">
                <p>Generation failed. <br/> {scene.error}</p>
                <button
                  onClick={() => onGenerate(scene.id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-300 transition-colors"
                >
                  Retry
                </button>
             </div>
          )}
          
          {scene.status === SceneStatus.COMPLETED && (
            <button 
              onClick={handleDownload}
              className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-white p-2 rounded-lg hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
              title="Download Media"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};