import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { Scene } from '../types';

interface FullStoryPlayerProps {
  scenes: Scene[];
  onClose: () => void;
}

export const FullStoryPlayer: React.FC<FullStoryPlayerProps> = ({ scenes, onClose }) => {
  const validScenes = useMemo(() => scenes.filter(s => s.videoUri || s.imageUri), [scenes]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const imageTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastHandledIndex = useRef<number>(-1);

  const currentScene = validScenes[currentIndex];
  const isVideo = !!currentScene?.videoUri;
  const hasAudio = !!currentScene?.audioUri;
  const IMAGE_DURATION_MS = 5000;

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

    // Force media elements to reload their sources
    if (videoRef.current) {
      videoRef.current.load();
    }
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [currentIndex]);

  // Playback control: separate from progress updates to avoid loops
  useEffect(() => {
    let active = true;

    const syncPlayback = async () => {
      if (!active) return;

      if (!isPlaying) {
        if (videoRef.current) videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        if (imageTimerRef.current) cancelAnimationFrame(imageTimerRef.current);
        return;
      }

      // Start audio
      if (audioRef.current && hasAudio) {
        try {
          // Only play if not already playing at the start
          if (audioRef.current.paused) {
            await audioRef.current.play();
          }
        } catch (e) {
          console.warn("Audio play failed", e);
        }
      }

      // Start video
      if (videoRef.current && isVideo) {
        try {
          videoRef.current.loop = hasAudio;
          if (videoRef.current.paused) {
            await videoRef.current.play();
          }
        } catch (e) {
          console.warn("Video play failed", e);
        }
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
  }, [isPlaying, currentIndex, isVideo, hasAudio, startTimer]); // progress is NOT a dependency here

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
      if (target.duration > 0) {
        setProgress(target.currentTime / target.duration);
      }
    } else if (!hasAudio && isVideo && target === videoRef.current) {
      if (target.duration > 0) {
        setProgress(target.currentTime / target.duration);
      }
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
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


  const handleYouTubeUpload = async () => {
    // Check if auth has happened (mock check for prototype)
    if (!window.confirm("Upload this video to YouTube?")) return;

    // In a real flow, we'd check strict auth state or redirect to /api/auth/youtube
    // For now, we simulate the "Send" action to our backend endpoint
    try {
      const title = `VisionaryTutor Scene ${currentIndex + 1} - ${currentScene.title}`;
      const description = currentScene.script;

      // Use the backend endpoint
      const res = await fetch('http://localhost:5000/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: currentScene.videoUri, // This might need to be a real URL for the backend to fetch
          title,
          description
        })
      });
      const data = await res.json();

      if (data.success) {
        alert(`Upload Started! Video ID: ${data.videoId || 'pending'}`);
      } else {
        // If auth failed, redirect user to auth
        if (window.confirm("YouTube Authentication required. Connect now?")) {
          window.location.href = 'http://localhost:5000/api/auth/youtube';
        }
      }
    } catch (e) {
      console.error("Upload failed", e);
      alert("Upload failed. Ensure backend is running.");
    }
  };

  return (

    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-start animate-fade-in">
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

      {/* Static Header - Not absolute */}
      <div className="w-full shrink-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white/80 font-mono text-sm">
          Scene {currentIndex + 1} of {validScenes.length}: {currentScene.title}
        </div>
        <div className="flex items-center gap-3">
          {isVideo && (
            <button
              onClick={handleYouTubeUpload}
              className="text-red-500 hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all flex items-center gap-2 px-4"
              title="Send to YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-white">YouTube</span>
            </button>
          )}

          <button onClick={handleDownload} className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Indicators - positioned below header */}
      <div className="w-full flex justify-center gap-1.5 pb-2 shrink-0 z-20">
        {validScenes.map((_, idx) => (
          <div key={idx} className={`w-12 h-1 rounded-full transition-all ${idx === currentIndex ? 'bg-white' : idx < currentIndex ? 'bg-white/50' : 'bg-white/20'}`} />
        ))}
      </div>


      {/* Main Content Area - Flex 1 to take remaining space, Top aligned */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-start overflow-y-auto" onClick={togglePlay}>

        {/* Video Container with top margin */}
        <div className="relative shrink-0 w-full max-w-6xl flex items-center justify-center px-4 mt-8 mb-32">
          {isVideo ? (
            <video
              key={`video-${currentIndex}`}
              ref={videoRef}
              src={currentScene.videoUri}
              className="max-h-[60vh] max-w-full w-auto object-contain rounded-lg shadow-2xl bg-black"
              onEnded={() => !hasAudio && handleEnded()}
              onTimeUpdate={handleTimeUpdate}
              playsInline
              muted
              preload="auto"
            />
          ) : (
            <img
              key={`img-${currentIndex}`}
              src={currentScene.imageUri}
              alt={currentScene.title}
              className="max-h-[60vh] max-w-full w-auto object-contain animate-fade-in rounded-lg shadow-2xl bg-black"
            />
          )}

          {/* Play/Pause Overlay Centered on Media */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none rounded-lg">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center box-shadow-xl scale-100 hover:scale-105 transition-transform">
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
        </div>

        {/* Navigation Buttons: Fixed position relative to viewport or absolute in container? 
            Let's make them fixed-ish or absolute to screen center to be always accessible 
        */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-30">
          <button onClick={handlePrev} disabled={currentIndex === 0} className={`pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all ${currentIndex === 0 ? 'opacity-0' : 'opacity-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button onClick={handleNext} disabled={currentIndex === validScenes.length - 1} className={`pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all ${currentIndex === validScenes.length - 1 ? 'opacity-0' : 'opacity-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Script: Pushed to bottom of scrollable area via margin if needed, or absolute bottom */}
        <div className="absolute bottom-12 left-0 right-0 text-center px-8 pointer-events-none z-30">
          <div className="inline-block bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-xl text-lg md:text-xl font-medium leading-relaxed max-w-4xl shadow-lg">
            {currentScene.script}
          </div>
        </div>
      </div>

      {/* Progress Bar Fixed Bottom */}
      <div className="absolute bottom-0 w-full h-1 bg-slate-800 z-40">
        <div className="h-full bg-indigo-500 transition-all duration-75" style={{ width: `${progress * 100}%` }}></div>
      </div>

    </div>
  );
};