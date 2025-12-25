import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { StoryStudioInput, StoryStudioContent, StoryProject } from '../types';
import { createFullStory, updateScript } from '../services/gemini';

interface StoryStudioProps {
  onSendToProduction: (storyId: string) => void;
  initialStory?: StoryProject | null;
}

export const StoryStudio: React.FC<StoryStudioProps> = ({ onSendToProduction, initialStory }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [input, setInput] = useState<StoryStudioInput>({
    audience: initialStory?.inputs?.audience as any || 'Student',
    platform: initialStory?.inputs?.platform as any || 'YouTube Long',
    length: initialStory?.inputs?.length as any || '60s',
    storyType: initialStory?.inputs?.storyType as any || 'Myth-busting',
    tone: initialStory?.inputs?.tone as any || 'Friendly',
    topic: initialStory?.inputs?.topic || '',
    ctaStyle: initialStory?.inputs?.ctaStyle as any || 'Soft'
  });

  const [content, setContent] = useState<StoryStudioContent | null>(
    initialStory?.outputs ? (initialStory.outputs as any) : null
  );
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(initialStory?._id || null);

  useEffect(() => {
    if (initialStory) {
      setInput({
        audience: initialStory.inputs.audience as any,
        platform: initialStory.inputs.platform as any,
        length: initialStory.inputs.length as any,
        storyType: initialStory.inputs.storyType as any,
        tone: initialStory.inputs.tone as any,
        topic: initialStory.inputs.topic,
        ctaStyle: initialStory.inputs.ctaStyle as any,
      });
      if (initialStory.outputs) {
        setContent(initialStory.outputs as any);
        setCurrentStoryId(initialStory._id!);
      }
    }
  }, [initialStory]);

  useEffect(() => {
    if (location.state && (location.state as any).prefilledTopic) {
      const state = location.state as any;
      setInput(prev => ({
        ...prev,
        topic: state.prefilledTopic,
        // Optional: Map other fields if passed
        audience: state.prefilledAudience || prev.audience,
        platform: state.prefilledPlatform === 'youtube' ? 'YouTube Long' : prev.platform
      }));
    }
  }, [location.state]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleGenerate = async () => {
    if (!input.topic) return;
    setIsGenerating(true);
    try {
      const story = await createFullStory(input);
      if (story.outputs) {
        setContent(story.outputs as unknown as StoryStudioContent);
        setCurrentStoryId(story._id!);
      }
    } catch (error) {
      console.error("Failed to generate story", error);
      alert("Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (section: keyof StoryStudioContent) => {
    if (!content || !currentStoryId) return;
    setRegeneratingSection(section);
    // TODO: Implement regeneration via backend
    alert("Regeneration coming in next update.");
    setRegeneratingSection(null);
  };

  const handleUpdateScript = (index: number, field: 'heading' | 'content', value: string) => {
    if (!content) return;
    const newScript = [...content.script];
    newScript[index] = { ...newScript[index], [field]: value };
    setContent({ ...content, script: newScript });
    setSaveStatus('idle');
  };

  const handleSaveScript = async () => {
    if (!currentStoryId || !content) return;
    setIsSaving(true);
    try {
      await updateScript(currentStoryId, content.script);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error("Failed to save script", e);
      alert("Failed to save script changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAll = () => {
    if (!content) return;
    const text = `
TOPIC: ${input.topic}

HOOKS:
${content.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}

TITLES:
${content.titles.join('\n')}

SCRIPT:
${content.script.map(s => `[${s.heading}]\n${s.content}`).join('\n\n')}

CAPTIONS:
${content.captions.join(', ')}

DESCRIPTION:
${content.descriptionTemplate}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-white mb-4">Content Controls</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Topic</label>
              <textarea
                value={input.topic}
                onChange={e => setInput({ ...input, topic: e.target.value })}
                placeholder="What is this story about?"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Audience</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  value={input.audience}
                  onChange={e => setInput({ ...input, audience: e.target.value as any })}
                >
                  <option>Student</option>
                  <option>Parent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Platform</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  value={input.platform}
                  onChange={e => setInput({ ...input, platform: e.target.value as any })}
                >
                  <option>YouTube Long</option>
                  <option>Shorts</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Length</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  value={input.length}
                  onChange={e => setInput({ ...input, length: e.target.value as any })}
                >
                  <option>30s</option>
                  <option>60s</option>
                  <option>3-5min</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Tone</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  value={input.tone}
                  onChange={e => setInput({ ...input, tone: e.target.value as any })}
                >
                  <option>Friendly</option>
                  <option>Urgent</option>
                  <option>Authoritative</option>
                  <option>Calm</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Story Type</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                value={input.storyType}
                onChange={e => setInput({ ...input, storyType: e.target.value as any })}
              >
                <option>Policy confusion</option>
                <option>Myth-busting</option>
                <option>Deadline horror story</option>
                <option>Essay mistake</option>
                <option>Parent reassurance</option>
                <option>Product demo</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.topic}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
            >
              {isGenerating ? 'Strategizing...' : 'Generate Full Story'}
            </button>
          </div>
        </div>

        {/* Output Main Area */}
        <div className="lg:col-span-2 space-y-6">
          {!content && !isGenerating && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
              <p className="text-lg">Fill in the details to generate your viral script.</p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-800/30 h-48 rounded-2xl animate-pulse border border-slate-700/50" />
              ))}
            </div>
          )}

          {content && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCopyAll}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${copyStatus === 'copied' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}
                >
                  {copyStatus === 'copied' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                      </svg>
                      Copied Story
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                      Copy All Text
                    </>
                  )}
                </button>
              </div>

              {/* Hooks Card */}
              <SectionCard
                title="Viral Hooks"
                onRegenerate={() => handleRegenerate('hooks')}
                isRegenerating={regeneratingSection === 'hooks'}
              >
                <div className="space-y-3">
                  {content.hooks.map((hook, i) => (
                    <div key={i} className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-300 text-sm">
                      <span className="text-indigo-400 font-bold mr-2">#{i + 1}</span> {hook}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Titles Card */}
              <SectionCard
                title="Optimized Titles"
                onRegenerate={() => handleRegenerate('titles')}
                isRegenerating={regeneratingSection === 'titles'}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {content.titles.map((title, i) => (
                    <div key={i} className="p-3 bg-slate-900 border border-slate-700/50 rounded-lg text-white text-xs font-medium">
                      {title}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Script Card */}
              <SectionCard
                title="The Script"
                onRegenerate={() => handleRegenerate('script')}
                isRegenerating={regeneratingSection === 'script'}
              >
                <div className="space-y-6">
                  {content.script.map((seg, i) => (
                    <div key={i} className="space-y-2 group bg-slate-900/40 p-3 rounded-xl border border-transparent hover:border-slate-700/50 transition-colors">
                      <input
                        value={seg.heading}
                        onChange={(e) => handleUpdateScript(i, 'heading', e.target.value)}
                        className="text-indigo-400 text-xs font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 p-0 w-full placeholder-indigo-400/50"
                        placeholder="SECTION HEADING"
                      />
                      <textarea
                        value={seg.content}
                        onChange={(e) => handleUpdateScript(i, 'content', e.target.value)}
                        className="w-full bg-transparent text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border-none focus:ring-0 p-0 resize-none overflow-hidden min-h-[60px]"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                    </div>
                  ))}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveScript}
                      disabled={isSaving || saveStatus === 'saved'}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${saveStatus === 'saved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col items-center gap-4">
                  <button
                    onClick={() => currentStoryId && onSendToProduction(currentStoryId)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold flex items-center gap-3 hover:shadow-xl hover:shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    Create Video Production Plan
                  </button>

                  <button
                    onClick={() => {
                      if (currentStoryId) {
                        navigate('/writing', { state: { storyId: currentStoryId } });
                      }
                    }}
                    className="px-8 py-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl font-bold flex items-center gap-2 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Convert to Article
                  </button>
                  <p className="text-slate-500 text-xs">This will intelligently split your script into scenes with visual prompts.</p>
                </div>
              </SectionCard>

              {/* Captions Card */}
              <SectionCard
                title="On-Screen Captions"
                onRegenerate={() => handleRegenerate('captions')}
                isRegenerating={regeneratingSection === 'captions'}
              >
                <div className="flex flex-wrap gap-2">
                  {content.captions.map((cap, i) => (
                    <span key={i} className="px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded-full text-xs">
                      {cap}
                    </span>
                  ))}
                </div>
              </SectionCard>

              {/* Description Card */}
              <SectionCard title="Description & Disclaimer" noRegenerate>
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-slate-400 whitespace-pre-wrap">
                  {content.descriptionTemplate}
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  noRegenerate?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, onRegenerate, isRegenerating, noRegenerate }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
    <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/60">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {!noRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors disabled:opacity-50"
          title="Regenerate this section"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      )}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);
