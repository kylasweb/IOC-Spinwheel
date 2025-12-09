import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCongratulatoryMessage = async (prizeName: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return `Congratulations! You've won ${prizeName}! Drive safe!`;

  try {
    const prompt = `
      Write a short, punchy, and cheerful congratulatory message (max 20 words) for a customer who just won "${prizeName}" at an Indian Oil Corporation fuel station. 
      Include a brief safety reminder or a fuel efficiency tip. 
      Tone: Professional but energetic.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || `Congratulations on winning ${prizeName}! Enjoy your journey with Indian Oil.`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Congratulations! You've won ${prizeName}! Thank you for choosing Indian Oil.`;
  }
};