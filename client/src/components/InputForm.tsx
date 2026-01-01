import React, { useState } from 'react';
import type { TutorialRequest } from '../types';
import { analyzeVideoContent } from '../services/gemini';

interface InputFormProps {
  onSubmit: (data: TutorialRequest) => void;
  disabled: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, disabled }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('Beginners');
  const [storyType, setStoryType] = useState('Educational');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && description.trim()) {
      onSubmit({ topic, description, audience, storyType });
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!videoUrl.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeVideoContent(videoUrl);
      if (result) {
        setDescription(result);
        if (!topic) {
          // Attempt to extract a simple topic if description is long
          // Look for "Topic: " prefix explicitly if LLM put it there
          const topicMatch = result.match(/Topic:\s*(.*)/i);
          if (topicMatch) {
            setTopic(topicMatch[1].trim());
          } else {
            const simpleTopic = result.split('\n')[0].substring(0, 50);
            setTopic(simpleTopic.replace(/[\*\#]/g, '').trim());
          }
        }
      }
    } catch (e) {
      console.error("Failed to analyze video", e);
      alert("Failed to analyze video. Please check the URL.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6 bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
      <div className="space-y-4">
        {/* Import Section */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <label htmlFor="videoUrl" className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
            Import from Video (Youtube, etc.)
          </label>
          <div className="flex gap-2">
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={disabled || isAnalyzing}
              placeholder="Paste video URL to auto-fill description..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={handleAnalyzeVideo}
              disabled={disabled || isAnalyzing || !videoUrl.trim()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  Auto-Fill
                </>
              )}
            </button>
          </div>
        </div>

        <hr className="border-slate-700/50" />

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">
            Tutorial Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={disabled}
            placeholder="e.g., How to make Sourdough Bread"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-slate-300 mb-1">
              Target Audience
            </label>
            <select
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={disabled}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            >
              <option>Beginners</option>
              <option>Intermediate</option>
              <option>Experts</option>
              <option>Children</option>
              <option>Professional</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
            Description & Key Points
          </label>
          <textarea
            id="description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            placeholder="Describe what needs to be covered..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="storyType" className="block text-sm font-medium text-slate-300 mb-1">
              Story Content Type
            </label>
            <select
              id="storyType"
              value={storyType}
              onChange={(e) => setStoryType(e.target.value)}
              disabled={disabled}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            >
              <option value="Educational">Educational (Standard)</option>
              <option value="Strict Content">Strict Content (No Examples/Filler)</option>
              <option value="Myth-busting">Myth-busting</option>
              <option value="Product demo">Product Demo</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !topic.trim() || !description.trim()}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${disabled
          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 text-white transform hover:-translate-y-0.5'
          }`}
      >
        {disabled ? (
          <span>Processing...</span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
            </svg>
            <span>Generate Video Tutorial</span>
          </>
        )}
      </button>
    </form>
  );
};