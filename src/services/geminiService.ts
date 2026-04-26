import { GoogleGenAI } from "@google/genai";
import { TranslationResponse } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in the Secrets panel.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const translateText = async (
  text: string, 
  sourceLang: string, 
  targetLang: string, 
  tone: string = 'neutral'
): Promise<TranslationResponse> => {
  const ai = getAI();
  const prompt = `
    Translate the following text from ${sourceLang === 'auto' ? 'detected language' : sourceLang} to ${targetLang}.
    Tone/Style: ${tone}
    
    Requirements:
    1. Provide a semantic, context-aware translation.
    2. Maintain the emotional resonance and intent.
    3. Return valid JSON only with the following structure:
    {
      "translatedText": "...",
      "detectedLanguage": "...",
      "detectedTone": "...",
      "explanation": "Brief explanation of cultural context or nuances if applicable"
    }

    Text: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}") as TranslationResponse;
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};

export const enhanceTranslation = async (text: string): Promise<string> => {
  const ai = getAI();
  const prompt = `Improve the following translation for clarity, natural flow, and professional tone: "${text}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || text;
  } catch (error) {
    return text;
  }
};
