import OpenAI from 'openai';
import { StoryOutputs } from '../../../shared/types/story';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
const { GoogleGenAI, Modality } = require("@google/genai");
const genAI = geminiKey ? new GoogleGenAI(geminiKey) : null;

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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    // @ts-ignore
                    imageConfig: { aspectRatio: "16:9" }
                }
            });
            const part = result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (part) {
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
            const model = genAI.getGenerativeModel({ model: "veo-3.1-fast-generate-preview" });

            // Poll for completion (simplified version of the loop from visionary-tutor)
            let operation: any = await model.generateVideos({
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9',
                },
            });

            while (!operation.done) {
                await new Promise(r => setTimeout(r, 5000));
                operation = await genAI.operations.getVideosOperation({ operation: operation });
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text }] }],
                config: {
                    // @ts-ignore
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                }
            });

            const base64Audio = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
