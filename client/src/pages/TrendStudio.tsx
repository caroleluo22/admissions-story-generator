import React, { useState, useEffect } from 'react';
import { analyzeBusinessTrends, getTopicDeepDive, generatePostLeads, getTrendHistory, getTrendHistoryItem, getStorySuggestions } from '../services/trend';
import { AnalysisReport, TopicBubble, SocialPost, LeadProfile, Platform, TrendAppStatus, TrendHistoryItem, StorySuggestion } from '../types/trend';
import { useNavigate } from 'react-router-dom';
import { AppMode } from '../types';
import TrendLineChart from '../components/trend/TrendLineChart';
import TopicBubbleChart from '../components/trend/TopicBubbleChart';
import { Search, Youtube, Users, FileText, ArrowRight, Loader2, Instagram, Facebook, Twitter, X, ExternalLink, MessageCircle, Heart, Eye, Share2, Download, CheckCircle2, MessageSquare, Clock, History, Sparkles, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Header } from '../components/Header'; // Assuming Header is used across pages

const TrendStudio: React.FC = () => {
    const navigate = useNavigate();
    const [businessName, setBusinessName] = useState('');
    const [platform, setPlatform] = useState<Platform>('youtube');
    const [status, setStatus] = useState<TrendAppStatus>(TrendAppStatus.IDLE);
    const [data, setData] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    // History State
    const [history, setHistory] = useState<TrendHistoryItem[]>([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Deep Dive State
    const [selectedTopic, setSelectedTopic] = useState<TopicBubble | null>(null);
    const [topicPosts, setTopicPosts] = useState<SocialPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingLeads, setLoadingLeads] = useState<{ [key: number]: boolean }>({});

    // Suggestions State
    const [suggestions, setSuggestions] = useState<StorySuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    // Lock body scroll when deep dive modal is open
    useEffect(() => {
        if (selectedTopic) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedTopic]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const items = await getTrendHistory();
            setHistory(items);
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleHistoryClick = async (id: string, savedPlatform: Platform, savedBusiness: string) => {
        setStatus(TrendAppStatus.ANALYZING_SEARCH); // Re-using loading state visually
        setHistoryOpen(false); // Close sidebar on mobile/desktop
        setBusinessName(savedBusiness);
        setPlatform(savedPlatform);
        setError(null);

        try {
            const report = await getTrendHistoryItem(id);
            setData(report);
            setStatus(TrendAppStatus.SUCCESS);
        } catch (e: any) {
            console.error(e);
            setError("Failed to load historical analysis.");
            setStatus(TrendAppStatus.ERROR);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessName.trim()) return;

        setStatus(TrendAppStatus.ANALYZING_SEARCH);
        setError(null);
        setData(null);
        setSelectedTopic(null); // Reset deep dive
        setShowSuggestions(false); // Reset suggestions

        try {
            const result = await analyzeBusinessTrends(businessName, platform);
            setData(result);
            setStatus(TrendAppStatus.SUCCESS);
            loadHistory(); // Refresh history list after new successful analysis
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to analyze business trends.");
            setStatus(TrendAppStatus.ERROR);
        }
    };

    const handleTopicClick = async (topic: TopicBubble) => {
        setSelectedTopic(topic);
        setLoadingPosts(true);
        setTopicPosts([]);
        setLoadingLeads({});
        setShowSuggestions(false); // Ensure suggestions are closed when opening a new topic

        try {
            const posts = await getTopicDeepDive(businessName, platform, topic.name);
            setTopicPosts(posts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPosts(false);
        }
    };

    const closeDeepDive = () => {
        setSelectedTopic(null);
        setTopicPosts([]);
        setLoadingLeads({});
        setShowSuggestions(false);
    };

    const handleGenerateConcepts = async () => {
        if (!selectedTopic || !data) return;

        setLoadingSuggestions(true);
        try {
            const persona = data.audience?.[0]?.name || 'Target Audience';
            const results = await getStorySuggestions(businessName, platform, selectedTopic.name, persona);
            setSuggestions(results);
            setShowSuggestions(true);
        } catch (e) {
            console.error("Failed to generate suggestions", e);
            // Fallback to direct navigation if generation fails
            const persona = data?.audience?.[0];
            const prompt = `Create a story about "${selectedTopic.name}" specifically for ${persona?.name || 'our audience'}. \n\nContext: This helps resolve pain points like ${persona?.painPoints?.join(', ') || 'uncertainty'}.\nKey Insight: Capitalize on the trend of ${selectedTopic.category}.`;
            navigate('/studio', {
                state: {
                    appMode: AppMode.STORY_STUDIO,
                    prefilledTopic: prompt,
                    prefilledAudience: 'Student',
                    prefilledPlatform: platform
                }
            });
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSuggestionSelect = (suggestion: StorySuggestion) => {
        navigate('/studio', {
            state: {
                appMode: AppMode.STORY_STUDIO,
                prefilledTopic: suggestion.prompt,
                prefilledAudience: 'Student', // Ideally we'd map this from the suggestion too
                prefilledPlatform: platform
            }
        });
    };

    const handleAnalyzeLeads = async (index: number, postContent: string, postUrl?: string) => {
        setLoadingLeads(prev => ({ ...prev, [index]: true }));
        try {
            // Pass the specific URL so the AI can attempt to find real comments using Google Search Grounding
            const leads = await generatePostLeads(businessName, platform, postContent, postUrl);
            const updatedPosts = [...topicPosts];
            updatedPosts[index] = { ...updatedPosts[index], leads };
            setTopicPosts(updatedPosts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingLeads(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleDownloadLeads = (leads: LeadProfile[], postIndex: number) => {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(leads, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `leads_comments_post_${postIndex + 1}_${businessName.replace(/\s+/g, '_')}.json`;
        link.click();
    };

    const getPlatformLabel = () => {
        if (platform === 'x') return 'X';
        return platform.charAt(0).toUpperCase() + platform.slice(1);
    };

    const getPlatformIcon = (p: Platform, className: string) => {
        if (p === 'youtube') return <Youtube className={className} />;
        if (p === 'instagram') return <Instagram className={className} />;
        if (p === 'facebook') return <Facebook className={className} />;
        return <Twitter className={className} />;
    };

    const getContentTerm = () => {
        if (platform === 'youtube') return 'Video';
        if (platform === 'x') return 'Tweet';
        return 'Post';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative overflow-x-hidden">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative">

                {/* History Toggle */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={() => setHistoryOpen(!historyOpen)}
                        className="p-2 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full border border-slate-800 hover:border-slate-700 transition-all"
                        title="Analysis History"
                    >
                        <History className="w-5 h-5" />
                    </button>
                </div>

                {/* History Sidebar */}
                <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" /> Recent Analyses
                        </h3>
                        <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto h-[calc(100vh-65px)] space-y-3">
                        {loadingHistory ? (
                            <div className="flex justify-center py-4 text-slate-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        ) : history.length > 0 ? (
                            history.map(item => (
                                <button
                                    key={item._id}
                                    onClick={() => handleHistoryClick(item._id, item.platform, item.businessName)}
                                    className="w-full text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                                            {item.businessName}
                                        </span>
                                        {getPlatformIcon(item.platform, "w-3 h-3 text-slate-500")}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No recent history.</p>
                        )}
                    </div>
                </div>

                {/* Overlay for sidebar */}
                {historyOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setHistoryOpen(false)}
                    />
                )}

                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Unlock <span className="text-indigo-500">Social Insights</span>
                    </h1>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                        Discover what audiences are saying on social media. Identify personas, track sentiment, and spot trends.
                    </p>

                    <div className="flex justify-center mb-8">
                        <div className="bg-slate-900 p-1 rounded-full border border-slate-800 flex flex-wrap justify-center gap-1">
                            <button
                                onClick={() => setPlatform('youtube')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${platform === 'youtube'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Youtube className="w-4 h-4" />
                                YouTube
                            </button>
                            <button
                                onClick={() => setPlatform('instagram')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${platform === 'instagram'
                                    ? 'bg-pink-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Instagram className="w-4 h-4" />
                                Instagram
                            </button>
                            <button
                                onClick={() => setPlatform('facebook')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${platform === 'facebook'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Facebook className="w-4 h-4" />
                                Facebook
                            </button>
                            <button
                                onClick={() => setPlatform('x')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${platform === 'x'
                                    ? 'bg-slate-100 text-slate-900 shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Twitter className="w-4 h-4" />
                                X
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative max-w-lg mx-auto group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder={`Enter a topic for ${getPlatformLabel()} analysis...`}
                            className="block w-full pl-11 pr-12 py-4 bg-slate-900 border border-slate-700 rounded-full text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xl"
                            disabled={status === TrendAppStatus.ANALYZING_SEARCH}
                        />
                        <button
                            type="submit"
                            disabled={status === TrendAppStatus.ANALYZING_SEARCH || !businessName.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === TrendAppStatus.ANALYZING_SEARCH ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </button>
                    </form>

                    {status === TrendAppStatus.ANALYZING_SEARCH && (
                        <div className="mt-6 flex flex-col items-center gap-2 text-indigo-400 text-sm animate-pulse">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Analyzing {getPlatformLabel()} trends & grounding data...</span>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-200 text-sm">
                            Error: {error}
                        </div>
                    )}
                </div>

                {/* Results Dashboard */}
                {status === TrendAppStatus.SUCCESS && data && (
                    <div className="space-y-8 animate-fade-in-up">

                        {/* Top Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TrendLineChart data={data.trendHistory} />
                            <TopicBubbleChart data={data.topics} onTopicClick={handleTopicClick} />
                        </div>

                        {/* Audience Personas */}
                        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
                            <div className="flex items-center gap-3 mb-8">
                                <Users className="w-6 h-6 text-indigo-400" />
                                <h2 className="text-2xl font-bold text-white">Identified {platform === 'youtube' ? 'Viewer' : 'Follower'} Personas</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {data.audience?.map((persona, idx) => (
                                    <div key={idx} className="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-2xl group-hover:bg-indigo-900/50 transition-colors">
                                            {['🧑‍💻', '🎬', '🛍️'][idx % 3]}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">{persona.name}</h3>
                                        <p className="text-slate-400 text-sm mb-4 leading-relaxed">{persona.description}</p>

                                        <div className="mb-4">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Pain Points</h4>
                                            <ul className="space-y-1">
                                                {persona.painPoints?.map((pt, i) => (
                                                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                        <span className="text-red-400 mt-0.5">•</span> {pt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Interests</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {persona.interests?.map((int, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                                                        {int}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Executive Report */}
                        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <FileText className="w-6 h-6 text-indigo-400" />
                                <h2 className="text-2xl font-bold text-white">Executive Report</h2>
                            </div>
                            <div className="prose prose-invert prose-slate max-w-none">
                                <ReactMarkdown>{data.executiveSummary}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Sources */}
                        {data.sources.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <h4 className="text-sm font-semibold text-slate-500 mb-4">Sources & Citations</h4>
                                <div className="flex flex-wrap gap-4">
                                    {data.sources.map((source, idx) => (
                                        <a
                                            key={idx}
                                            href={source.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-indigo-400 hover:border-indigo-900 transition-all"
                                        >
                                            {getPlatformIcon(platform, "w-3 h-3")}
                                            <span className="truncate max-w-[200px]">{source.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </main>

            {/* Deep Dive Modal */}
            {selectedTopic && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={closeDeepDive}></div>
                    <div className="bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] overflow-hidden flex flex-col relative z-10 animate-fade-in-up">


                        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950 z-20">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-500/20 p-2 rounded-lg">
                                    {getPlatformIcon(platform, "w-5 h-5 text-indigo-400")}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Popular Content: {selectedTopic.name}</h3>
                                    <p className="text-slate-400 text-xs">{selectedTopic.category} • Popularity Score: {selectedTopic.value}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleGenerateConcepts}
                                    disabled={loadingSuggestions}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate Story Concept
                                </button>
                                <button onClick={closeDeepDive} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex-1 overflow-hidden min-h-0">

                            {/* Suggestions Overlay */}
                            {showSuggestions && (
                                <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md p-6 animate-fade-in flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                                            Choose a Story Angle
                                        </h3>
                                        <button onClick={() => setShowSuggestions(false)} className="text-slate-400 hover:text-white">
                                            <span className="text-sm underline">Back to posts</span>
                                        </button>
                                    </div>

                                    <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 overscroll-contain">



                                        {suggestions.map((s, i) => (
                                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500 transition-all flex flex-col">
                                                <div className="mb-4">
                                                    <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 mb-2 border border-slate-700">
                                                        {s.angle}
                                                    </span>
                                                    <h4 className="text-lg font-bold text-white leading-tight mb-2">{s.title}</h4>
                                                    <p className="text-sm text-slate-400 italic mb-4">"{s.hook}"</p>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-grow">
                                                        {s.summary}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleSuggestionSelect(s)}
                                                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 mt-auto"
                                                >
                                                    Select This Concept <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={`h-full overflow-y-auto p-6 overscroll-contain ${showSuggestions ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                                {loadingPosts ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                        <p>Searching for popular {getPlatformLabel()} posts...</p>
                                    </div>
                                ) : topicPosts.length > 0 ? (
                                    <div className="space-y-6">
                                        {topicPosts.map((post, i) => (
                                            <div key={i} className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-indigo-500/30 transition-all">
                                                {/* Post Header */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                                                        <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                                                            {(post.author || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                        {post.author || 'Unknown User'}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${(post.sentiment || 'neutral') === 'positive' ? 'bg-green-900/30 text-green-400' :
                                                        (post.sentiment || 'neutral') === 'negative' ? 'bg-red-900/30 text-red-400' : 'bg-slate-700 text-slate-400'
                                                        }`}>
                                                        {post.sentiment || 'neutral'}
                                                    </span>
                                                </div>

                                                {/* Engagement Metrics */}
                                                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 ml-10">
                                                    <span className="flex items-center gap-1.5" title="Likes">
                                                        <Heart className="w-3.5 h-3.5 text-pink-500/80" /> {post.likes}
                                                    </span>
                                                    <span className="flex items-center gap-1.5" title="Views">
                                                        <Eye className="w-3.5 h-3.5 text-blue-400/80" /> {post.views}
                                                    </span>
                                                    <span className="flex items-center gap-1.5" title="Comments">
                                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400/80" /> {post.comments}
                                                    </span>
                                                    <span className="flex items-center gap-1.5" title="Shares">
                                                        <Share2 className="w-3.5 h-3.5 text-indigo-400/80" /> {post.shares}
                                                    </span>
                                                </div>

                                                {/* Post Content */}
                                                <div className="ml-10 mb-4">
                                                    <p className="text-slate-300 text-sm leading-relaxed">
                                                        {post.content}
                                                    </p>
                                                </div>

                                                {/* Footer & Actions */}
                                                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800 ml-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400">
                                                            {post.type}
                                                        </span>
                                                        {post.url && (
                                                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
                                                                View {getContentTerm()} <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lead Generation Section */}
                                                <div className="mt-4 pt-3 border-t border-dashed border-slate-800 ml-10">
                                                    {!post.leads ? (
                                                        <button
                                                            onClick={() => handleAnalyzeLeads(i, post.content, post.url)}
                                                            disabled={loadingLeads[i]}
                                                            className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/30 hover:bg-emerald-950/50 px-3 py-2 rounded-lg border border-emerald-900/50 w-full justify-center"
                                                        >
                                                            {loadingLeads[i] ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                                                            Analyze Comments & Extract Leads
                                                        </button>
                                                    ) : (
                                                        <div className="animate-fade-in">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                    <Users className="w-3 h-3" /> Extracted Commenters
                                                                </h4>
                                                                <button
                                                                    onClick={() => handleDownloadLeads(post.leads!, i)}
                                                                    className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700 transition-colors"
                                                                >
                                                                    <Download className="w-3 h-3" /> Export JSON
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {Array.isArray(post.leads) && post.leads.map((lead, idx) => (
                                                                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-2 flex flex-col gap-1.5 relative overflow-hidden">
                                                                        {lead.isReal && (
                                                                            <div className="absolute top-0 right-0 bg-emerald-600/20 px-1.5 py-0.5 rounded-bl text-[8px] text-emerald-400 flex items-center gap-0.5 border-l border-b border-emerald-600/30">
                                                                                <CheckCircle2 className="w-2 h-2" /> Real Verified Comment
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center justify-between mt-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-indigo-400">{lead.handle}</span>
                                                                                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 rounded">{lead.persona}</span>
                                                                            </div>
                                                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${lead.buyingSignal === 'High' ? 'bg-emerald-900/30 text-emerald-400' :
                                                                                lead.buyingSignal === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-slate-800 text-slate-500'
                                                                                }`}>
                                                                                {lead.buyingSignal} Signal
                                                                            </div>
                                                                        </div>
                                                                        <div className="bg-slate-900/50 p-1.5 rounded text-[11px] text-slate-300 italic border-l-2 border-indigo-500/50">
                                                                            "{lead.commentSnippet}"
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-500 pl-1">Intent: {lead.intent}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p>No specific posts found for this topic.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
                            <span className="text-xs text-slate-500">
                                Results utilize Google Search to find real comments where possible, but may use simulation for non-public data.
                            </span>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default TrendStudio;

