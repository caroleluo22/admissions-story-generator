"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateSection = exports.generateStory = void 0;
const openai_1 = __importDefault(require("openai"));
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new openai_1.default({ apiKey }) : null;
const generateJSON = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    if (!openai) {
        throw new Error('OpenAI client not initialized. Check your API key.');
    }
    try {
        const completion = yield openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });
        const content = completion.choices[0].message.content;
        if (!content)
            throw new Error('No content from LLM');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('LLM Error:', error);
        throw error;
    }
});
const generateStory = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    if (!openai) {
        console.warn('No OPENAI_API_KEY found. Returning mock data.');
        return mockStoryGeneration();
    }
    return generateJSON(prompt);
});
exports.generateStory = generateStory;
const regenerateSection = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    return generateJSON(prompt);
});
exports.regenerateSection = regenerateSection;
const mockStoryGeneration = () => ({
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
