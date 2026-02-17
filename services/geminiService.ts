
import { GoogleGenAI, Type } from "@google/genai";
import { MoodType, Recommendation } from "../types";

// Fix: Initializing GoogleGenAI with exactly process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVibeResponse = async (
  prompt: string, 
  mood: MoodType, 
  language: string = 'English'
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user's current mood is ${mood}. They said: "${prompt}". 
    The response should be in ${language}. 
    Be engaging, helpful, and adapt your personality to fit the mood. 
    If they are sad, be empathetic. If they are bored, be funny. 
    If they want to vent about someone, provide a witty (but safe) roast.`,
    config: {
      temperature: 0.8,
      topK: 40,
      topP: 0.9,
    },
  });
  // Fix: Access response.text directly (property, not a method).
  return response.text || "I'm processing your vibe right now...";
};

export const getMoodRecommendations = async (
  mood: MoodType
): Promise<Recommendation[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 4 diverse recommendations for someone feeling ${mood}. 
    Include one activity, one exercise, one joke/roast, and one quote/story.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            intensity: { type: Type.STRING },
          },
          required: ["id", "type", "title", "content", "intensity"],
        },
      },
    },
  });

  try {
    // Fix: Access response.text directly and trim it before parsing.
    const jsonStr = response.text?.trim() || '[]';
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse recommendations", e);
    return [];
  }
};
