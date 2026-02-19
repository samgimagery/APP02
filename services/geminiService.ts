
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PhilosopherData } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchPhilosopherContent = async (philosopherName: string): Promise<PhilosopherData> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Give me a famous thinker named "${philosopherName}" or pick a random profound one if the name is generic. Provide:
    1. Their full name
    2. Birth/death dates
    3. Exactly 3 famous short quotes (each max 15 words)
    4. A brief one-sentence summary of their greatest achievements
    5. An array of 5 interesting, lesser-known facts about their life or philosophy.
    6. Their gender (Male or Female) to determine voice type.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quotes: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 3 distinct quotes."
          },
          dates: { type: Type.STRING },
          achievements: { type: Type.STRING },
          facts: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          gender: { type: Type.STRING, description: "Male or Female" }
        },
        required: ["name", "quotes", "dates", "achievements", "facts", "gender"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const fetchAdditionalQuote = async (philosopherName: string, existingQuotes: string[]): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide one more profound and famous quote by ${philosopherName} that is NOT in this list: [${existingQuotes.join(', ')}]. Keep it under 15 words. Return ONLY the quote text.`,
  });
  return response.text.trim().replace(/^["']|["']$/g, '');
};

export const generatePhilosopherPortrait = async (philosopherName: string): Promise<string> => {
  const ai = getAI();
  const prompt = `A vibrant, full-frame cinematic oil painting portrait of ${philosopherName}. 19th-century master style, rich colors, heavy chiaroscuro lighting. COMPOSITION: Tight head-and-shoulders crop, eyes visible and expressive. NO BORDERS, NO PICTURE FRAMES, NO MATTES, NO MARGINS. The painting must fill every pixel to the very edge of the canvas. Deep textures, moody shadows, masterfully blended oil strokes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
      }
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Failed to generate image data.");
  return imageUrl;
};
