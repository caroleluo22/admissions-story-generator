import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { generateArticle, getStory, listStories } from '../services/gemini';
import { ArrowLeft, FileText, Loader2, Copy, Check, PenTool, ChevronDown } from 'lucide-react';
import type { StoryProject } from '../types';
import { Header } from '../components/Header';
import ReactMarkdown from 'react-markdown';

const WritingStudio: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [storyId, setStoryId] = useState('');
    const [stories, setStories] = useState<StoryProject[]>([]);
    const [isLoadingStories, setIsLoadingStories] = useState(true);

    useEffect(() => {
        if (location.state && (location.state as any).storyId) {
            setStoryId((location.state as any).storyId);
        }
    }, [location.state]);
    const [article, setArticle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const loadStories = async () => {
            try {
                const list = await listStories();
                setStories(list);
            } catch (e) {
                console.error("Failed to load stories", e);
            } finally {
                setIsLoadingStories(false);
            }
        };
        loadStories();
    }, []);

    const handleGenerate = async () => {
        if (!storyId) return;
        setIsGenerating(true);
        setStatus('loading');
        try {
            const result = await generateArticle(storyId);
            setArticle(result);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(article);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            <Header />

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/studio')} className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Writing Studio
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <PenTool className="w-4 h-4 text-indigo-400" />
                                Source Story
                            </h2>
                            <p className="text-sm text-slate-400 mb-4">
                                Select a story from your library to convert into an article.
                            </p>

                            <div className="relative mb-4">
                                <select
                                    value={storyId}
                                    onChange={(e) => setStoryId(e.target.value)}
                                    disabled={isLoadingStories}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50"
                                >
                                    <option value="" disabled>Select a story...</option>
                                    {stories.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.inputs.topic} ({s.inputs.storyType})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            </div>

                            <div className="text-xs text-slate-500 text-center mb-4">
                                Or paste ID manually below
                            </div>

                            <input
                                type="text"
                                placeholder="Paste Story ID here..."
                                value={storyId}
                                onChange={(e) => setStoryId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={!storyId || isGenerating}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                Generate Article
                            </button>
                        </div>

                        {status === 'success' && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold mb-4">Export</h2>
                                <button
                                    onClick={handleCopy}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
                                >
                                    {copyStatus === 'copied' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    {copyStatus === 'copied' ? 'Copied to Clipboard' : 'Copy Text'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Editor / Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl min-h-[600px] flex flex-col overflow-hidden">
                            <div className="border-b border-slate-800 bg-slate-950/50 px-4 py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-400">Content Editor</span>
                                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!editMode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                    >
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${editMode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-auto">
                                {status === 'idle' && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                                        <p>Select a story to generated an article.</p>
                                    </div>
                                )}
                                {status === 'loading' && (
                                    <div className="h-full flex flex-col items-center justify-center text-indigo-400 animate-pulse">
                                        <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                                        <p>Crafting your article...</p>
                                    </div>
                                )}
                                {status === 'success' && (
                                    editMode ? (
                                        <textarea
                                            value={article}
                                            onChange={(e) => setArticle(e.target.value)}
                                            className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-300 font-mono text-sm resize-none leading-relaxed"
                                        />
                                    ) : (
                                        <div className="prose prose-invert prose-slate max-w-none">
                                            <ReactMarkdown>{article}</ReactMarkdown>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WritingStudio;
