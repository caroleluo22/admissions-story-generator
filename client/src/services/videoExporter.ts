import { Scene } from "../types";

export const exportStoryToVideo = async (
  scenes: Scene[], 
  onProgress: (msg: string) => void
): Promise<string> => {
  
  const width = 1280;
  const height = 720;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error("Could not create canvas context");
  
  // Fill black initially
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const stream = canvas.captureStream(30);
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();
  
  const tracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
  const combinedStream = new MediaStream(tracks);
  
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];
  
  const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
  if (!mimeType) throw new Error("No supported video mime type found for MediaRecorder");

  const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 5000000 });
  const chunks: Blob[] = [];
  
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  // Helper to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Helper to load video
  const loadVideo = (src: string): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const vid = document.createElement('video');
      vid.crossOrigin = "anonymous";
      vid.src = src;
      vid.preload = 'auto';
      vid.muted = true; // We use the TTS audio track for sound
      vid.onloadeddata = () => resolve(vid);
      vid.onerror = reject;
    });
  };

  // Helper to load audio buffer
  const loadAudio = async (src: string): Promise<AudioBuffer> => {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  };

  // Filter scenes
  const validScenes = scenes.filter(s => s.status === 'COMPLETED' && (s.videoUri || s.imageUri));

  if (validScenes.length === 0) {
      throw new Error("No completed scenes to export.");
  }

  for (let i = 0; i < validScenes.length; i++) {
    const scene = validScenes[i];
    onProgress(`Rendering scene ${i + 1} of ${validScenes.length}...`);
    
    let audioBuffer: AudioBuffer | null = null;
    let videoEl: HTMLVideoElement | null = null;
    let imgEl: HTMLImageElement | null = null;

    // Load Assets
    const promises: Promise<any>[] = [];
    if (scene.audioUri) promises.push(loadAudio(scene.audioUri).then(b => audioBuffer = b).catch(e => console.warn("Failed to load audio", e)));
    
    if (scene.videoUri) {
        promises.push(loadVideo(scene.videoUri).then(v => videoEl = v));
    } else if (scene.imageUri) {
        promises.push(loadImage(scene.imageUri).then(i => imgEl = i));
    }
    
    await Promise.all(promises);

    // Determine Duration
    // Default 5s (if image only), or use audio duration, or video duration if no audio
    let duration = 5000;
    if (audioBuffer) {
        duration = audioBuffer.duration * 1000;
    } else if (videoEl) {
        duration = videoEl.duration * 1000;
    }

    // Play Audio
    if (audioBuffer) {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      source.start();
    }

    // Play Video
    if (videoEl) {
       videoEl.loop = !!audioBuffer; // Loop video if there is narration
       await videoEl.play();
    }

    // Render Loop
    const startTime = performance.now();
    
    await new Promise<void>((resolve) => {
      const frame = () => {
        const now = performance.now();
        const elapsed = now - startTime;
        
        if (elapsed >= duration) {
          resolve();
          return;
        }

        // Draw visual
        // Basic fit logic (cover/contain) isn't strictly needed if we assume 16:9 generation
        if (videoEl) {
           ctx.drawImage(videoEl, 0, 0, width, height);
        } else if (imgEl) {
           ctx.drawImage(imgEl, 0, 0, width, height);
        }

        // Draw Subtitles (Simple)
        if (scene.script) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            const padding = 20;
            const fontSize = 24;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            const textY = height - 50;
            
            // Background bar for text roughly
            // A real implementation would wrap text, but here we just draw a simple box at bottom
            // Skipped for aesthetic purity or simple overlay logic
        }

        requestAnimationFrame(frame);
      };
      frame();
    });
    
    // Cleanup Video for next iteration
    if (videoEl) {
        videoEl.pause();
        videoEl.src = "";
        videoEl.load();
        videoEl.remove();
    }
  }

  // Stop everything
  recorder.stop();
  audioCtx.close();
  stream.getTracks().forEach(t => t.stop());

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(URL.createObjectURL(blob));
    };
  });
};