import { StoryInputs, StoryOutputs } from '../../../shared/types/story';
import { IBrandGuidelines } from '../models/BrandGuidelines';

export const buildStoryPrompt = (inputs: StoryInputs, brand: IBrandGuidelines | null) => {
  const brandContext = brand ?
    `Follow these brand guidelines:
     Tone: ${brand.toneOfVoice || 'Neutral'}
     Banned Terms: ${brand.bannedTerms.join(', ') || 'None'}
     Default Disclaimer: ${brand.defaultDisclaimer || 'None'}
     Default CTA: ${brand.defaultLinks || 'None'}`
    : 'No specific brand guidelines.';

  return `
    You are an expert admissions consultant and storyteller known for deep, unconventional insights.
    
    Context:
    ${brandContext}

    Task: Generate a high-impact YouTube script.
    Topic: ${inputs.topic}
    Audience: ${inputs.audience}
    Platform: ${inputs.platform}
    Length: ${inputs.length}
    Story Type: ${inputs.storyType}
    Tone: ${inputs.tone}
    CTA Style: ${inputs.ctaStyle}
    Source Material: ${inputs.sourceMaterial || 'None'}

    CRITICAL CONTENT GUIDELINES:
    1.  **NO GENERIC ADVICE**: Do not say "be yourself", "work hard", or "start early". These are banned phrases.
    2.  **CONCRETE EXAMPLES REQUIRED**: Every main point must be illustrated with a specific, realistic example (e.g., instead of "show leadership", say "like the student who organized a coding boot camp for 50 local seniors").
    3.  **COUNTER-INTUITIVE INSIGHT**: Include at least one insight that contradicts common wisdom (e.g., "Why having a 'well-rounded' profile is actually a trap").
    4.  **ACTIONABLE STEPS**: The script must allow the viewer to do something immediately after watching.

    Output must be valid JSON matching this structure:
    {
      "hooks": ["hook1 (specific scenario)", "hook2 (surprising stat)", "hook3 (bold claim)", "hook4", "hook5"],
      "script": [
        { "heading": "Hook", "content": "...", "visualCue": "..." },
        { "heading": "The Common Mistake", "content": "...", "visualCue": "..." },
        { "heading": "The Insight/Shift", "content": "...", "visualCue": "..." },
        { "heading": "Concrete Example", "content": "...", "visualCue": "..." },
        { "heading": "Specific Action Step", "content": "...", "visualCue": "..." },
        { "heading": "CTA", "content": "...", "visualCue": "..." }
      ],
      "captions": ["caption1", ...],
      "titles": ["title1", ...],
      "description": "..."
    }

    Ensure the content is engaging, accurate, and safe.
  `;
};

export const buildRegeneratePrompt = (
  inputs: StoryInputs,
  outputs: any, // StoryOutputs
  section: 'hooks' | 'script' | 'titles' | 'captions',
  brand: IBrandGuidelines | null
) => {
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

    Task: Provide a new, significantly improved version of the "${section}" section.
    
    CRITICAL QUALITY GUIDELINES:
    - **NO FLUFF**: Remove all filler words. Be concise and punchy.
    - **SPECIFICITY**: Use specific details (names, numbers, specific colleges) instead of generalizations.
    - **NO CLICHES**: Avoid "unlock your potential" or "dream big".

    - It must match the original story context and brand guidelines.
    - It must be DIFFERENT from the current version.
    - For "script", it must be an array of objects with "heading", "content", and optional "visualCue".
    - For others, it must be an array of strings.

    Output MUST be a JSON object with only ONE key: "${section}".
    Example: { "${section}": [...] }
  `;
};

export const buildArticlePrompt = (
  inputs: StoryInputs,
  outputs: StoryOutputs,
  brand: IBrandGuidelines | null
) => {
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

export const buildStoryboardPrompt = (
  inputs: StoryInputs,
  outputs: StoryOutputs,
  brand: IBrandGuidelines | null
) => {
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
          { "sceneNumber": 1, "id": "scene-1", "title": "Catchy Scene Title", "visualDescription": "...", "imagePrompt": "...", "scriptLine": "..." }
        ]
      }
    }
  `;
};
