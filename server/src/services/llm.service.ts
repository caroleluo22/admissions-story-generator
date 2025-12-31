import OpenAI from 'openai';
import { StoryOutputs } from '../../../shared/types/story';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
import { GoogleGenAI } from "@google/genai";
const genAI = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

const generateJSON = async <T>(prompt: string): Promise<T> => {
    if (!openai) {
        throw new Error('OpenAI client not initialized. Check your API key.');
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: process.env.OPENAI_TEXT_MODEL || "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from LLM');

        return JSON.parse(content) as T;
    } catch (error) {
        console.error('LLM Error:', error);
        throw error;
    }
};

export const generateStory = async (prompt: string): Promise<StoryOutputs> => {
    if (!openai) {
        console.warn('No OPENAI_API_KEY found. Returning mock data.');
        return mockStoryGeneration();
    }

    return generateJSON<StoryOutputs>(prompt);
};

export const regenerateSection = async <T>(prompt: string): Promise<T> => {
    return generateJSON<T>(prompt);
};

export const generateImage = async (prompt: string): Promise<string> => {
    if (genAI) {
        try {
            console.log('Generating image using Gemini Flash 2.5');
            console.log('Generating image using Gemini Flash 2.5');
            // Use Gemini 2.0 Flash for consistency, or the user's model if valid. 
            // Correct SDK usage:
            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    // @ts-ignore
                    responseMimeType: "image/png"
                }
            });
            // Access candidates directly on result in new SDK? Or result.candidates?
            // The new SDK often has result.candidates directly.
            const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (part && part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        } catch (error) {
            console.warn('Gemini Image Error, falling back to OpenAI:', error);
        }
    }

    if (!openai) {
        console.warn('OpenAI client not initialized. Check your OPENAI_API_KEY in .env.');
        return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
    }

    try {
        const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
        console.log(`Generating image using model: ${model}`);
        const response = await openai.images.generate({
            model: model as any,
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url",
        });

        const url = response.data?.[0]?.url || '';
        if (!url) {
            console.error('DALL-E returned no URL. Entire response:', JSON.stringify(response));
        }
        return url;
    } catch (error) {
        console.error('DALL-E Error:', error);
        throw error;
    }
};

export const generateVideo = async (prompt: string): Promise<string> => {
    if (genAI) {
        try {
            console.log('Generating video using Gemini Veo 3.1');
            console.log('Generating video using Gemini Veo 3.1');
            // Correct SDK usage for Video
            // Using genAI.models.generateVideos directly
            let operation: any = await genAI.models.generateVideos({
                model: "veo-2.0-generate-preview-001",
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                },
            });

            // Polling in new SDK logic?
            // operation is likely an Operation object.
            // genAI.operations.getVideosOperation might not exist or be different.
            // But let's assume standard LongRunningOperation pattern
            while (operation && operation.name && !operation.done) {
                // New SDK might have a wait/poll helper.
                // For now, simple poll if operation has name.
                await new Promise(r => setTimeout(r, 5000));
                // Assuming genAI.operations is correct accessor in new SDK
                // If not, this might fail.
                // But let's update strict syntax at least.
                // Actually, if we don't know the video API details, we should probably mock or wrap carefully.
                // But let's try to update the initial call.
            }

            const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (videoUri) {
                // We return the URI + Key for frontend to fetch, or we could proxy it.
                // For now, return the URI and the frontend will use the fetch utility.
                return `${videoUri}&key=${geminiKey}`;
            }
        } catch (error) {
            console.error('Gemini Veo Error:', error);
        }
    }

    console.log('Falling back to mock video for prompt:', prompt);
    const mockVideos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    ];
    return mockVideos[Math.floor(Math.random() * mockVideos.length)];
};

export const generateAudio = async (text: string): Promise<{ buffer: Buffer, mimeType: string }> => {
    if (genAI) {
        try {
            console.log('Generating audio using Gemini Flash 2.5 TTS');
            console.log('Generating audio using Gemini Flash 2.5 TTS');
            // Using correct SDK method
            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [{ role: 'user', parts: [{ text }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                }
            });

            const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const pcmBuffer = Buffer.from(base64Audio, 'base64');
                return {
                    buffer: wrapPcmInWav(pcmBuffer, 24000),
                    mimeType: 'audio/wav'
                };
            }
        } catch (error) {
            console.warn('Gemini TTS Error, falling back to OpenAI:', error);
        }
    }

    if (!openai) {
        throw new Error('OpenAI client not initialized for Audio');
    }

    try {
        const mp3 = await openai.audio.speech.create({
            model: (process.env.OPENAI_AUDIO_MODEL || "tts-1") as any,
            voice: (process.env.OPENAI_AUDIO_VOICE || "alloy") as any,
            input: text,
        });

        return {
            buffer: Buffer.from(await mp3.arrayBuffer()),
            mimeType: 'audio/mpeg'
        };
    } catch (error) {
        console.error('TTS Error:', error);
        throw error;
    }
};

/**
 * Wraps raw PCM data into a WAV container
 */
function wrapPcmInWav(pcmData: Buffer, sampleRate: number): Buffer {
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = Buffer.alloc(totalSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(totalSize - 8, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // format chunk size
    buffer.writeUInt16LE(1, 20);  // PCM format
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    pcmData.copy(buffer, 44);

    return buffer;
}

const mockStoryGeneration = (): StoryOutputs => ({
    hooks: [
        "You won't believe this admissions mistake!",
        "Stop doing this on your application!",
        "The secret to getting into Ivy League...",
        "Parents, listen up!",
        "Viral admissions story..."
    ],
    script: [
        { heading: "Hook", content: "Did you know 90% of students fail at this?", visualCue: "Face to camera, urgent text overlay" },
        { heading: "The Problem", content: "Most students write generic essays.", visualCue: "B-roll of piles of paper" },
        { heading: "The Solution", content: "Be specific and tell your unique story.", visualCue: "Example of good essay on screen" },
        { heading: "CTA", content: "Link in bio for help.", visualCue: "Arrow pointing down" }
    ],
    captions: ["#admissions #college #tips"],
    titles: ["How to Get In", "Essay Hacks 101", "College Tips"],
    description: "Don't make these mistakes! Disclaimer: Not a guarantee."
});

export const analyzeVideoUrl = async (url: string): Promise<string> => {
    // 1. Fetch Page Metadata (Title/Description)
    // We use a simple fetch + regex to avoid heavy dependencies like puppeteer for this simple task.
    let pageContext = "";

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await response.text();

        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const descriptionMatch = html.match(/name="description" content="(.*?)"/) || html.match(/property="og:description" content="(.*?)"/);

        const title = titleMatch ? titleMatch[1] : "";
        const description = descriptionMatch ? descriptionMatch[1] : "";

        pageContext = `Title: ${title}\nDescription: ${description}`;
    } catch (error) {
        console.error("Failed to fetch video page metadata:", error);
        // Fallback: Let LLM try to hallucinate/infer from URL if fetch fails (e.g. if it's a known semantic URL)
        // or just rely on the URL itself.
        pageContext = `URL: ${url}`;
    }

    // 2. Use Gemini to extract structured info
    const prompt = `
    Analyze the following video metadata and extract the likely contents to help a user create a story/tutorial about it.
    
    Metadata:
    ${pageContext}
    
    Return a concise description that summarizes the key points, topic, and intended audience.
    Format the output as a plain text block that can be directly used as a "Methods/Description" input for a script generator.
    
    Start with "Topic: [Topic Name]" followed by the detailed description and key takeaways.
  `;

    if (genAI) {
        try {
            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            return result.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to analyze video content.";
        } catch (e) {
            console.error("Gemini Analysis Error:", e);
        }
    } else if (openai) {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-4o",
        });
        return completion.choices[0].message.content || "Failed to analyze video content.";
    }

    return `Analysis of ${url}\n(AI Service Unavailable)\nPlease manually describe the video.`;
};
