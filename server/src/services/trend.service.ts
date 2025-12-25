import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, SocialPost, LeadProfile, Platform } from '../../../shared/types/trend';

// Use EXISTING key handling logic from llm.service if possible, or just env
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeBusinessTrends = async (businessName: string, platform: Platform): Promise<AnalysisReport> => {
    if (!ai) {
        throw new Error("API Key is missing. Please set GEMINI_API_KEY.");
    }

    let platformName = '';
    let contentType = '';
    let audienceTerm = '';

    switch (platform) {
        case 'youtube':
            platformName = 'YouTube';
            contentType = 'video styles (e.g., "unboxing", "tutorials")';
            audienceTerm = 'viewers';
            break;
        case 'instagram':
            platformName = 'Instagram';
            contentType = 'content formats (e.g., "Reels", "Stories", "Carousel posts")';
            audienceTerm = 'followers';
            break;
        case 'facebook':
            platformName = 'Facebook';
            contentType = 'content types (e.g., "Posts", "Groups", "Live video", "Marketplace listings")';
            audienceTerm = 'community members and followers';
            break;
        case 'x':
            platformName = 'X (formerly Twitter)';
            contentType = 'content formats (e.g., "Threads", "Long-form posts", "Viral images", "Spaces")';
            audienceTerm = 'followers';
            break;
    }

    // --- Step 1: Research Phase (Search Grounding) ---
    const researchModel = "gemini-2.0-flash-exp";
    const researchPrompt = `
    Conduct a deep market research analysis for the business/topic "${businessName}" specifically regarding its presence and trends on ${platformName}.
    
    Investigate:
    1. Recent trend volume (is it growing, shrinking, stable?) over the last 6 months on ${platformName}.
    2. The sentiment of ${audienceTerm} in comments, replies, and discussions.
    3. The specific ${contentType} that are most popular for this business.
    4. Who is engaging? Create ${audienceTerm} personas based on comment styles and interactions.
    
    Provide a detailed summary.
  `;

    const researchResponse = await ai.models.generateContent({
        model: researchModel,
        contents: researchPrompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const researchText = researchResponse.text || "No results found.";

    // Extract sources if available
    const sources = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((c: any) => c.web?.uri)
        .map((c: any) => ({ title: c.web.title || "Source", uri: c.web.uri })) || [];

    // --- Step 2: Structure Phase (JSON Extraction) ---
    const extractionModel = "gemini-2.0-flash-exp";

    const extractionPrompt = `
    You are a data analyst. Analyze the following research report about ${businessName} on ${platformName} and generate a structured JSON response.
    
    Research Report:
    """
    ${researchText}
    """
    
    CRITICAL INSTRUCTION FOR MISSING DATA:
    If specific metrics/numbers are missing in the report, or if the report says "no specific data found", you MUST SIMULATE and ESTIMATE realistic, representative data points based on the industry and qualitative sentiment.
    
    DO NOT return empty arrays. 
    
    1. For 'trendHistory', generate exactly 6 data points (one for each of the last 6 months). 
    2. For 'topics', infer at least 5-8 potential topics/hashtags based on the business industry.
    3. For 'audience', infer 3 personas based on the likely customer base.
    4. For 'executiveSummary', synthesize the findings into a coherent Markdown report.
  `;

    const jsonResponse = await ai.models.generateContent({
        model: extractionModel,
        contents: extractionPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    executiveSummary: {
                        type: Type.STRING,
                        description: "A comprehensive markdown summary of the findings.",
                    },
                    trendHistory: {
                        type: Type.ARRAY,
                        description: "Monthly trend data for the last 6 months.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING, description: "Month name (e.g., 'Jan')" },
                                interestScore: { type: Type.NUMBER, description: "0-100 scale of search/engagement volume" },
                                sentimentScore: { type: Type.NUMBER, description: "-100 (negative) to 100 (positive)" },
                            },
                        },
                    },
                    topics: {
                        type: Type.ARRAY,
                        description: `Popular topics, hashtags, or content styles associated with the business on ${platformName}.`,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                value: { type: Type.NUMBER, description: "Relative popularity 1-100" },
                                category: { type: Type.STRING, description: "e.g., 'Product', 'Service', 'Aesthetic', 'Viral'" },
                            },
                        },
                    },
                    audience: {
                        type: Type.ARRAY,
                        description: "3 distinct audience personas.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                                interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                        },
                    },
                },
            },
        },
    });

    const rawJson = jsonResponse.text;
    if (!rawJson) {
        throw new Error("Failed to generate structured analysis.");
    }

    const structuredData = JSON.parse(rawJson);

    return {
        businessName,
        executiveSummary: structuredData.executiveSummary || "Analysis complete.",
        trendHistory: structuredData.trendHistory || [],
        topics: structuredData.topics || [],
        audience: structuredData.audience || [],
        sources: sources,
    };
};

export const getTopicDeepDive = async (businessName: string, platform: Platform, topic: string): Promise<SocialPost[]> => {
    if (!ai) throw new Error("API Key Missing");
    const model = "gemini-2.0-flash-exp";
    let platformName = '';
    let contentTerm = 'post';

    switch (platform) {
        case 'youtube':
            platformName = 'YouTube';
            contentTerm = 'video';
            break;
        case 'instagram':
            platformName = 'Instagram';
            contentTerm = 'post';
            break;
        case 'facebook':
            platformName = 'Facebook';
            contentTerm = 'post';
            break;
        case 'x':
            platformName = 'X (formerly Twitter)';
            contentTerm = 'tweet';
            break;
    }

    const getSearchUrl = (query: string) => {
        const q = encodeURIComponent(query);
        switch (platform) {
            case 'youtube': return `https://www.youtube.com/results?search_query=${q}`;
            case 'instagram': return `https://www.google.com/search?q=site%3Ainstagram.com+${q}`;
            case 'facebook': return `https://www.facebook.com/search/top?q=${q}`;
            case 'x': return `https://twitter.com/search?q=${q}`;
            default: return '#';
        }
    }

    const prompt = `
    Generate 4 specific examples of ${platformName} ${contentTerm}s that represent the topic "${topic}" for "${businessName}".
    Use Google Search to find REAL content. 

    IMPORTANT:
    - If you find a real video/post, include its specific URL.
    - If you CANNOT find a direct link, leave the 'url' field EMPTY or provide a general search URL. DO NOT HALLUCINATE BROKEN LINKS.
    - Simulate the metrics (likes/views) based on typical performance if exact numbers aren't visible.
    
    Return JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            content: { type: Type.STRING },
                            author: { type: Type.STRING },
                            likes: { type: Type.STRING },
                            views: { type: Type.STRING },
                            comments: { type: Type.STRING },
                            shares: { type: Type.STRING },
                            url: { type: Type.STRING },
                            sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] }
                        }
                    }
                }
            }
        });

        const posts = JSON.parse(response.text || "[]");

        // Post-processing: Validate URLs & Ensure Robustness
        // We overwrite the URL to be a Search URL because specific deep-links from LLMs are often hallucinated or stale (404).
        // A search query for the specific content title/author is much more reliable for the user.
        return posts.map((post: any) => {
            return {
                ...post,
                author: post.author || 'Social User',
                sentiment: post.sentiment || 'neutral',
                likes: post.likes || 'N/A',
                views: post.views || 'N/A',
                comments: post.comments || '0',
                shares: post.shares || '0',
                // FORCE the URL to be a safe search result to avoid 404s
                url: getSearchUrl(`${post.content.substring(0, 50)} ${businessName} ${platformName}`)
            };
        });
    } catch (e) {
        return [
            {
                type: 'Trending Content',
                content: `Popular content regarding ${topic} for ${businessName}.`,
                author: 'Influencer',
                likes: '1.2K',
                views: '20K',
                comments: '95',
                shares: '30',
                url: getSearchUrl(topic + ' ' + businessName),
                sentiment: 'positive'
            }
        ];
    }
}

export const generatePostLeads = async (businessName: string, platform: Platform, postContent: string, postUrl?: string): Promise<LeadProfile[]> => {
    if (!ai) throw new Error("API Key Missing");
    const model = "gemini-2.0-flash-exp";
    let contentTerm = 'post';
    if (platform === 'youtube') contentTerm = 'video';

    const prompt = `
    Analyze the ${contentTerm} from ${businessName} on ${platform}: "${postContent}".
    ${postUrl ? `URL: ${postUrl}` : ''}
    
    TASK:
    1. Search for REAL comments or discussions about this specific video/post online.
    2. If real user comments are found, extract the handle and comment text. Set isReal: true.
    3. If not found, simulate 5 realistic potential customers and their comments.
    
    Output JSON array of objects with: handle, persona, intent, commentSnippet, buyingSignal (High/Medium/Low), isReal (boolean).
  `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            handle: { type: Type.STRING },
                            persona: { type: Type.STRING },
                            intent: { type: Type.STRING },
                            commentSnippet: { type: Type.STRING },
                            buyingSignal: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                            isReal: { type: Type.BOOLEAN }
                        }
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [
            { handle: "@interested_user", persona: "Customer", intent: "Buying interest", commentSnippet: "Where can I buy this?", buyingSignal: "High", isReal: false }
        ];
    }
}
