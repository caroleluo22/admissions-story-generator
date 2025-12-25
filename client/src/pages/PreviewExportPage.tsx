import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory } from '../services/gemini';
import { exportStoryToVideo } from '../services/videoExporter';
import { Scene } from '../types';

export const PreviewExportPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Player State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const imageTimerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const lastHandledIndex = useRef<number>(-1);

    const validScenes = useMemo(() => scenes.filter(s => s.videoUri || s.imageUri), [scenes]);
    const currentScene = validScenes[currentIndex];
    const isVideo = !!currentScene?.videoUri;
    const hasAudio = !!currentScene?.audioUri;
    const IMAGE_DURATION_MS = 5000;

    useEffect(() => {
        if (!id) {
            setError('No story ID provided');
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                const loadedScenes = await getStory(id);
                setScenes(loadedScenes);
                // If no scenes have media, warn user?
            } catch (e) {
                setError('Failed to load story');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleEnded = useCallback(() => {
        if (lastHandledIndex.current === currentIndex) return;
        lastHandledIndex.current = currentIndex;

        if (currentIndex < validScenes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsPlaying(false);
            setProgress(1);
        }
    }, [currentIndex, validScenes.length]);

    const startTimer = useCallback((startTimeOffset: number = 0) => {
        if (hasAudio) return;

        startTimeRef.current = performance.now() - startTimeOffset;

        const animate = (time: number) => {
            const elapsed = time - startTimeRef.current;
            const newProgress = Math.min(elapsed / IMAGE_DURATION_MS, 1);
            setProgress(newProgress);

            if (elapsed < IMAGE_DURATION_MS) {
                imageTimerRef.current = requestAnimationFrame(animate);
            } else {
                handleEnded();
            }
        };
        imageTimerRef.current = requestAnimationFrame(animate);
    }, [hasAudio, handleEnded]);

    // Scene setup: when currentIndex changes, reset everything
    useEffect(() => {
        lastHandledIndex.current = -1;
        setProgress(0);

        if (imageTimerRef.current) {
            cancelAnimationFrame(imageTimerRef.current);
            imageTimerRef.current = null;
        }

        if (videoRef.current) videoRef.current.load();
        if (audioRef.current) audioRef.current.load();
    }, [currentIndex]);

    // Playback control
    useEffect(() => {
        let active = true;

        const syncPlayback = async () => {
            if (!active) return;
            if (!currentScene) return;

            if (!isPlaying) {
                if (videoRef.current) videoRef.current.pause();
                if (audioRef.current) audioRef.current.pause();
                if (imageTimerRef.current) cancelAnimationFrame(imageTimerRef.current);
                return;
            }

            // Start audio
            if (audioRef.current && hasAudio) {
                try {
                    if (audioRef.current.paused) await audioRef.current.play();
                } catch (e) { console.warn("Audio play failed", e); }
            }

            // Start video
            if (videoRef.current && isVideo) {
                try {
                    videoRef.current.loop = hasAudio; // Loop video if audio is longer/present? Logic from original player
                    if (videoRef.current.paused) await videoRef.current.play();
                } catch (e) { console.warn("Video play failed", e); }
            }

            // Start timer for images without audio
            if (!isVideo && !hasAudio) {
                startTimer(progress * IMAGE_DURATION_MS);
            }
        };

        syncPlayback();

        return () => {
            active = false;
            if (imageTimerRef.current) cancelAnimationFrame(imageTimerRef.current);
        };
    }, [isPlaying, currentIndex, isVideo, hasAudio, startTimer, currentScene]);

    const togglePlay = () => {
        if (!isPlaying && currentIndex === validScenes.length - 1 && progress >= 0.99) {
            setCurrentIndex(0);
            setProgress(0);
            setIsPlaying(true);
            return;
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex < validScenes.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsPlaying(true);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
        const target = e.currentTarget;
        if (hasAudio && target === audioRef.current) {
            if (target.duration > 0) setProgress(target.currentTime / target.duration);
        } else if (!hasAudio && isVideo && target === videoRef.current) {
            if (target.duration > 0) setProgress(target.currentTime / target.duration);
        }
    };

    const handleDownloadScene = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentScene) return;
        const uri = currentScene.videoUri || currentScene.imageUri;
        if (uri) {
            const a = document.createElement('a');
            a.href = uri;
            a.download = `${currentScene.title.replace(/[\s\W]+/g, '_')}_Scene${currentIndex + 1}.${currentScene.videoUri ? 'mp4' : 'png'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleFullExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        setExportProgress('Initializing render...');
        try {
            const url = await exportStoryToVideo(scenes, (msg) => setExportProgress(msg));
            const a = document.createElement('a');
            a.href = url;
            a.download = `VisionaryTutor_FullMovie_${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e: any) {
            console.error(e);
            alert(`Export failed: ${e.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleYouTubeUpload = async () => {
        if (!window.confirm("Upload this video to YouTube?")) return;
        try {
            const title = `VisionaryTutor Scene ${currentIndex + 1} - ${currentScene.title}`;
            const description = currentScene.script;
            const res = await fetch('http://localhost:5000/api/youtube/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl: currentScene.videoUri,
                    title,
                    description
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Upload Started! Video ID: ${data.videoId || 'pending'}`);
            } else {
                if (window.confirm("YouTube Authentication required. Connect now?")) {
                    window.location.href = 'http://localhost:5000/api/auth/youtube';
                }
            }
        } catch (e) {
            console.error("Upload failed", e);
            alert("Upload failed. Ensure backend is running.");
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Story...</div>;
    if (error) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{error}</div>;
    if (validScenes.length === 0) return <div className="min-h-screen bg-black text-white flex items-center justify-center">No generated media found in this story. Go back and generate scenes first.</div>;

    return (
        <div className="min-h-screen bg-black flex flex-col text-white font-sans">
            {/* Overlay for Exporting */}
            {isExporting && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h3 className="text-2xl font-bold text-white mb-2">Rendering Your Movie</h3>
                    <p className="text-indigo-300 font-mono mb-8">{exportProgress}</p>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-b from-slate-900 to-black">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Studio
                    </button>
                    <h1 className="text-lg font-bold text-white hidden md:block">Preview & Export: Scene {currentIndex + 1} of {validScenes.length}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleFullExport}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export Full Movie
                    </button>
                </div>
            </header>

            {/* Main Player Area */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4" onClick={togglePlay}>

                {/* Helper Elements for Media */}
                {hasAudio && (
                    <audio
                        key={`audio-${currentIndex}`}
                        ref={audioRef}
                        src={currentScene.audioUri}
                        onEnded={handleEnded}
                        onTimeUpdate={handleTimeUpdate}
                        preload="auto"
                    />
                )}

                {/* Media Container */}
                <div className="relative w-full max-w-5xl aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                    {isVideo ? (
                        <video
                            key={`video-${currentIndex}`}
                            ref={videoRef}
                            src={currentScene.videoUri}
                            className="w-full h-full object-contain bg-black"
                            onEnded={() => !hasAudio && handleEnded()}
                            onTimeUpdate={handleTimeUpdate}
                            playsInline
                            muted
                        />
                    ) : (
                        <img
                            key={`img-${currentIndex}`}
                            src={currentScene.imageUri}
                            alt={currentScene.title}
                            className="w-full h-full object-contain bg-black"
                        />
                    )}

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-all">
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shadow-2xl mb-12">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                                    {currentIndex === validScenes.length - 1 && progress >= 0.99 ? (
                                        <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h5.75a.75.75 0 0 0 .75-.75v-5.75a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.25a.75.75 0 0 0-.75.75v5.75a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                                    ) : (
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                    )}
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Hover Controls (Previous/Next) */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={handlePrev} disabled={currentIndex === 0} className="pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-white/20 text-white disabled:opacity-0 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <button onClick={handleNext} disabled={currentIndex === validScenes.length - 1} className="pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-white/20 text-white disabled:opacity-0 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>

                    {/* Scene Script Overlay - Subtitle Style */}
                    <div className="absolute bottom-16 inset-x-0 text-center px-4 pointer-events-none">
                        <span className="inline-block bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-lg md:text-xl font-medium shadow-sm">
                            {currentScene.script}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20 cursor-pointer hover:h-2 transition-all" onClick={(e) => {
                        e.stopPropagation();
                        // Seek logic could go here if we assume the bar represents the CURRENT SCENE time.
                        // For now it's just visual.
                    }}>
                        <div className="h-full bg-indigo-500" style={{ width: `${progress * 100}%` }} />
                    </div>
                </div>

                {/* Action Bar Below Video */}
                <div className="mt-8 flex items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-white/5 backdrop-blur">
                    <button onClick={handleDownloadScene} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium text-slate-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Scene
                    </button>
                    <div className="w-px h-6 bg-white/10"></div>
                    {isVideo && (
                        <button onClick={handleYouTubeUpload} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                            </svg>
                            Upload to YouTube
                        </button>
                    )}
                </div>
            </main>

            {/* Footer Sequence Strip */}
            <div className="h-24 border-t border-white/10 bg-slate-900 overflow-x-auto flex items-center px-4 gap-2 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-slate-800">
                {validScenes.map((scene, idx) => (
                    <button
                        key={scene.id}
                        onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                        className={`relative flex-shrink-0 w-32 h-16 rounded-md overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                        <img src={scene.imageUri || '/placeholder.png'} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] p-1 text-center truncate px-2">{scene.title}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};
