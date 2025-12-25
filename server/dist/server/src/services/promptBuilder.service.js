"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStoryboardPrompt = exports.buildArticlePrompt = exports.buildRegeneratePrompt = exports.buildStoryPrompt = void 0;
const buildStoryPrompt = (inputs, brand) => {
    const brandContext = brand ?
        `Follow these brand guidelines:
     Tone: ${brand.toneOfVoice || 'Neutral'}
     Banned Terms: ${brand.bannedTerms.join(', ') || 'None'}
     Default Disclaimer: ${brand.defaultDisclaimer || 'None'}
     Default CTA: ${brand.defaultLinks || 'None'}`
        : 'No specific brand guidelines.';
    return `
    You are an expert admissions consultant and storyteller.
    Context:
    ${brandContext}

    Task: Generate a YouTube script for:
    Topic: ${inputs.topic}
    Audience: ${inputs.audience}
    Platform: ${inputs.platform}
    Length: ${inputs.length}
    Story Type: ${inputs.storyType}
    Tone: ${inputs.tone}
    CTA Style: ${inputs.ctaStyle}
    Source Material: ${inputs.sourceMaterial || 'None'}

    Output must be valid JSON matching this structure:
    {
      "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
      "script": [
        { "heading": "Intro", "content": "...", "visualCue": "..." },
        ...
      ],
      "captions": ["caption1", ...],
      "titles": ["title1", ...],
      "description": "..."
    }

    Ensure the content is engaging, accurate, and safe (no admissions guarantees).
  `;
};
exports.buildStoryPrompt = buildStoryPrompt;
const buildRegeneratePrompt = (inputs, outputs, // StoryOutputs
section, brand) => {
    const brandContext = brand ?
        `Follow these brand guidelines:
     Tone: ${brand.toneOfVoice || 'Neutral'}
     Banned Terms: ${brand.bannedTerms.join(', ') || 'None'}
     Default Disclaimer: ${brand.defaultDisclaimer || 'None'}
     Default CTA: ${brand.defaultLinks || 'None'}`
        : 'No specific brand guidelines.';
    const currentContent = JSON.stringify(outputs[section], null, 2);
    return `
    You are an expert admissions consultant and storyteller.
    
    Context:
    ${brandContext}

    Current Story Inputs:
    - Topic: ${inputs.topic}
    - Audience: ${inputs.audience}
    - Platform: ${inputs.platform}
    - Length: ${inputs.length}
    - Tone: ${inputs.tone}

    The user wants to REGENERATE the "${section}" section of the story.
    
    Current "${section}" content:
    ${currentContent}

    Task: Provide a new, improved version of the "${section}" section.
    - It must match the original story context and brand guidelines.
    - It must be DIFFERENT from the current version.
    - For "script", it must be an array of objects with "heading", "content", and optional "visualCue".
    - For others, it must be an array of strings.

    Output MUST be a JSON object with only ONE key: "${section}".
    Example: { "${section}": [...] }
  `;
};
exports.buildRegeneratePrompt = buildRegeneratePrompt;
const buildArticlePrompt = (inputs, outputs, brand) => {
    const brandContext = brand ?
        `Follow these brand guidelines:
     Tone: ${brand.toneOfVoice || 'Neutral'}
     Banned Terms: ${brand.bannedTerms.join(', ') || 'None'}
     Default Disclaimer: ${brand.defaultDisclaimer || 'None'}
     Default CTA: ${brand.defaultLinks || 'None'}`
        : 'No specific brand guidelines.';
    const scriptContent = outputs.script.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
    return `
    You are an expert admissions copywriter and content strategist.
    
    Context:
    ${brandContext}

    Current Story Inputs:
    - Topic: ${inputs.topic}
    - Audience: ${inputs.audience}
    - Tone: ${inputs.tone}

    Your task is to convert the following video script into a professional, engaging, and SEO-optimized ARTICLE (800-1200 words).
    
    Current Script:
    ${scriptContent}

    Requirements:
    - Use Markdown for formatting (H1 for title, H2 for sections).
    - Expand on the points in the script to provide deep, valuable insights.
    - Write in a style that is natural for an article, not a video script.
    - Maintain the brand voice and avoid banned terms.
    - Ensure a logical flow from the hook/introduction to the call to action.

    Output MUST be a JSON object with only ONE key: "article".
    The value of "article" should be the full Markdown string.
    Example: { "article": "# Title\\n\\nContent..." }
  `;
};
exports.buildArticlePrompt = buildArticlePrompt;
const buildStoryboardPrompt = (inputs, outputs, brand) => {
    const brandContext = brand ?
        `Follow these brand guidelines:
     Tone: ${brand.toneOfVoice || 'Neutral'}`
        : '';
    const scriptJson = JSON.stringify(outputs.script, null, 2);
    return `
    You are an expert Storyboard Artist and AI Image Prompt Engineer.
    
    Context:
    ${brandContext}
    Topic: ${inputs.topic}

    Task: Create a visual storyboard for the following script to be turned into a CARTOON/ANIMATED video.

    Script:
    ${scriptJson}

    Requirements:
    1. Define 1-2 consistent characters (e.g., an admissions expert, a student). Provide their names, physical descriptions, and a "Character Base Prompt" to keep them consistent in AI image generators.
    2. Break the script into logical scenes.
    3. For each scene, provide:
       - A Visual Description: What is happening in the cartoon?
       - An Image Prompt: A highly detailed prompt for an AI image generator (like Midjourney) to create the background or scene asset. 
       - Style Note: Stick to a consistent "Admissions Cartoon" style (flat vector, or 3D Pixar style, depending on brand context).

    Output MUST be a JSON object with only ONE key: "storyboard".
    Structure:
    {
      "storyboard": {
        "characters": [
          { "name": "...", "description": "...", "prompt": "..." }
        ],
        "scenes": [
          { "sceneNumber": 1, "visualDescription": "...", "imagePrompt": "...", "scriptLine": "..." }
        ]
      }
    }
  `;
};
exports.buildStoryboardPrompt = buildStoryboardPrompt;
