import { GoogleGenAI } from "@google/genai";

const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBackgroundImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Using gemini-2.5-flash-image for standard generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt + " high quality, abstract, artistic background texture, no text, 4k" }
        ]
      },
      config: {
        // No specific responseMimeType needed for image gen models usually, 
        // but ensuring we handle the output correctly.
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           // Return the base64 string formatted for use in src
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

export const suggestTaglines = async (topic: string): Promise<string[]> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 catchy, short, modern taglines for a blog banner about: ${topic}. Return ONLY a JSON array of strings. Example: ["Master the Art", "Future is Now", "Design Your Life"]`,
    });

    const text = response.text || "[]";
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Text Gen Error:", error);
    return ["Create Something Amazing", "Design Your Future", "Innovative Ideas"];
  }
};