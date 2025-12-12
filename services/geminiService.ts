import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real production app, you might want to proxy this or require user input key.
// For this demo, we assume the environment variable is set as per instructions.
const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const runGeminiPrompt = async (promptText: string): Promise<string> => {
  if (!ai) {
    return "Error: API Key is missing. Please ensure process.env.API_KEY is available.";
  }

  try {
    // Using flash model for quick responses on the UI
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
        return `Error generating content: ${error.message}`;
    }
    return "An unexpected error occurred while contacting Gemini.";
  }
};

export const optimizePromptContent = async (originalPrompt: string): Promise<string> => {
    if (!ai) return originalPrompt;
    
    try {
        const metaPrompt = `You are an expert Prompt Engineer. 
        Your task is to optimize the following prompt to be more clear, structured, and effective for LLMs.
        Retain any variable placeholders like {topic} or {selection}. 
        Do not add any conversational text, just return the optimized prompt content directly.
        
        Original Prompt:
        ${originalPrompt}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: metaPrompt,
        });

        return response.text?.trim() || originalPrompt;
    } catch (error) {
        console.error("Optimization Error:", error);
        return originalPrompt;
    }
};