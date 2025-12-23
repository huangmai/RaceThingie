
import { GoogleGenAI, Type } from "@google/genai";

// Always instantiate GoogleGenAI inside functions to ensure the most up-to-date API key is used
export async function generateLevelNarration(winner: string, theme: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, hype victory message for a 2D parkour game. 
      Winner: ${winner}. 
      Theme: ${theme}. 
      Keep it under 20 words, very energetic and 'cyberpunk' styled.`,
      config: {
        temperature: 0.9,
      }
    });
    // Fix: Accessed .text as a property and ensured a trimmed string is returned
    return response.text?.trim() || "VICTORY ATTAINED!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Winner: ${winner}!`;
  }
}

export async function getLevelLayoutSeed(theme: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Define difficulty parameters for a parkour level with the theme: ${theme}. 
            Return a JSON object with: 
            gapSize (number 100-300), 
            hazardDensity (0-1), 
            platformHeightVariance (number 50-200),
            levelLength (number 3000-8000).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        gapSize: { type: Type.NUMBER },
                        hazardDensity: { type: Type.NUMBER },
                        platformHeightVariance: { type: Type.NUMBER },
                        levelLength: { type: Type.NUMBER }
                    },
                    // Using propertyOrdering as recommended for structured JSON responses
                    propertyOrdering: ["gapSize", "hazardDensity", "platformHeightVariance", "levelLength"]
                }
            }
        });
        
        // Fix: Added safety checks for the returned text before parsing
        const text = response.text;
        if (!text) throw new Error("API returned no content");
        return JSON.parse(text.trim());
    } catch (error) {
        console.error("Gemini Error:", error);
        return {
            gapSize: 200,
            hazardDensity: 0.2,
            platformHeightVariance: 100,
            levelLength: 5000
        };
    }
}
