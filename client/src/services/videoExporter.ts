import { Scene } from "../types";

export const exportStoryToVideo = async (
  scenes: Scene[],
  onProgress: (msg: string) => void
): Promise<string> => {

  const width = 1280;
  const height = 720;
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  // 1. Filter Scenes
  const validScenes = scenes.filter(s => s.status === 'COMPLETED' && (s.videoUri || s.imageUri));
  if (validScenes.length === 0) {
    throw new Error("No completed scenes to export.");
  }

  // 2. Pre-load All Assets
  onProgress("Pre-loading media assets...");

  interface LoadedSceneAssets {
    audioBuffer: AudioBuffer | null;
    videoEl: HTMLVideoElement | null;
    imgEl: HTMLImageElement | null;
    duration: number;
    scene: Scene;
  }

  const loadedScenes: LoadedSceneAssets[] = [];

  // Helper Loaders
  // Helper to proxy URL
  const getProxyUrl = (url: string) => {
    if (url.startsWith('http')) {
      return `http://localhost:5000/api/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        resolve(null);
      };
      img.src = getProxyUrl(src);
    });
  };

  const loadVideo = (src: string): Promise<HTMLVideoElement | null> => {
    return new Promise((resolve) => {
      const vid = document.createElement('video');
      vid.crossOrigin = "anonymous";
      vid.src = getProxyUrl(src);
      vid.preload = 'auto'; // Load full metadata+data if possible
      vid.muted = true;
      // We need it ready to play
      vid.oncanplaythrough = () => resolve(vid);
      vid.onloadeddata = () => resolve(vid); // Fallback
      vid.onerror = () => {
        console.warn(`Failed to load video: ${src}`);
        resolve(null);
      };
      // Timeout to avoid hanging
      setTimeout(() => resolve(null), 10000);
    });
  };

  const loadAudio = async (src: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(getProxyUrl(src));
      const arrayBuffer = await response.arrayBuffer();
      return await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.warn("Failed to load audio", e);
      return null;
    }
  };

  // Execute Loading
  for (let i = 0; i < validScenes.length; i++) {
    const s = validScenes[i];
    onProgress(`Loading assets for scene ${i + 1}/${validScenes.length}...`);

    let audioBuffer: AudioBuffer | null = null;
    let videoEl: HTMLVideoElement | null = null;
    let imgEl: HTMLImageElement | null = null;

    const promises: Promise<any>[] = [];
    if (s.audioUri) promises.push(loadAudio(s.audioUri).then(b => audioBuffer = b));

    if (s.videoUri) {
      promises.push(loadVideo(s.videoUri).then(v => videoEl = v));
    } else if (s.imageUri) {
      promises.push(loadImage(s.imageUri).then(img => imgEl = img));
    }

    await Promise.all(promises);

    // Calculate Duration
    let duration = 5000;
    if (audioBuffer) duration = audioBuffer.duration * 1000;
    else if (videoEl && videoEl.duration) duration = videoEl.duration * 1000;

    loadedScenes.push({
      audioBuffer, videoEl, imgEl, duration, scene: s
    });
  }

  // 3. Setup Recording
  onProgress("Starting Render...");

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error("Could not create canvas context");

  // Initial black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Check for immediate taint issues (rare here, but good sanitary check before stream)
  try {
    ctx.getImageData(0, 0, 1, 1);
  } catch (e) {
    throw new Error("Canvas is tainted immediately. Cannot export.");
  }

  const stream = canvas.captureStream(30);
  const dest = audioCtx.createMediaStreamDestination();

  const tracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
  const combinedStream = new MediaStream(tracks);

  const mimeTypes = [
    'video/webm',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/mp4'
  ];
  const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
  if (!mimeType) throw new Error("No supported video mime type found");

  const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 5000000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start(100); // Start with timeslice to ensure data flow

  // 4. Render Loop (Sequential)
  for (let i = 0; i < loadedScenes.length; i++) {
    const { audioBuffer, videoEl, imgEl, duration, scene } = loadedScenes[i];
    onProgress(`Rendering scene ${i + 1}/${loadedScenes.length}...`);

    // Audio
    if (audioBuffer) {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      source.start();
    }

    // Video Play
    if (videoEl) {
      videoEl.currentTime = 0;
      videoEl.loop = !!audioBuffer; // Loop if narrated
      await videoEl.play().catch(e => console.warn("Video play failed", e));
    }

    // Frame Loop for Duration
    const startTime = performance.now();

    // Check Taint before starting scene render to fail fast if asset ruined it
    try {
      ctx.getImageData(0, 0, 1, 1);
    } catch (e) {
      console.error("Canvas tainted! Skipping scene visual to save export.");
      continue;
    }

    await new Promise<void>((resolve) => {
      const renderFrame = () => {
        const now = performance.now();
        const elapsed = now - startTime;

        if (elapsed >= duration) {
          resolve();
          return;
        }

        // Draw
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        if (videoEl) {
          ctx.drawImage(videoEl, 0, 0, width, height);
        } else if (imgEl) {
          ctx.drawImage(imgEl, 0, 0, width, height);
        } else {
          // Missing media placeholder
          ctx.fillStyle = '#222';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#666';
          ctx.font = '30px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Scene Media Missing', width / 2, height / 2);
        }

        // Subtitles
        if (scene.script) {
          ctx.save();
          // Simple shadow for readability
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.font = '24px Inter, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';

          // Word wrap would be ideal, but simple centered text for now
          const text = scene.script.length > 80 ? scene.script.substring(0, 80) + '...' : scene.script;
          ctx.fillText(text, width / 2, height - 50);
          ctx.restore();
        }

        requestAnimationFrame(renderFrame);
      };
      renderFrame();
    });

    // Cleanup Video
    if (videoEl) {
      videoEl.pause();
    }
  }

  // 5. Finalize
  onProgress("Finalizing video...");
  recorder.stop();
  audioCtx.close();
  stream.getTracks().forEach(t => t.stop());

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      console.log(`Export complete. Blob size: ${blob.size}, Chunks: ${chunks.length}`);
      resolve(URL.createObjectURL(blob));
    };
  });
};