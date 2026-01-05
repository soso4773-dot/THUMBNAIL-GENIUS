
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeInputs = async (script: string, imageBase64?: string): Promise<AIAnalysisResult> => {
  const ai = getAIClient();
  
  const prompt = `
    Task: You are a YouTube branding expert.
    1. Analyze this video script: "${script.substring(0, 2000)}"
    2. Suggest the MOST provocative and catchy thumbnail title (Max 8 characters).
    3. Analyze the provided reference image (if any) to extract: Layout, Color Palette, and Mood.
    4. CRITICAL: Determine if the reference image is an "artistic" (drawing, illustration, 3D render, cartoon) or "realistic" (real photo, cinematic photography) style.
    
    Return a JSON response.
  `;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(',')[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The catchy 6-8 char thumbnail text" },
          styleDescription: { type: Type.STRING, description: "Description of the layout, palette, and mood" },
          styleType: { type: Type.STRING, enum: ["artistic", "realistic"], description: "Whether the style is artistic or realistic" }
        },
        required: ["text", "styleDescription", "styleType"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateBackground = async (topic: string, style: string, styleType: string, userRequest?: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Create a professional YouTube thumbnail background image. 
  Topic: ${topic}. 
  Style guidelines: ${style}. 
  STYLE TYPE: This MUST be a ${styleType === 'artistic' ? 'digital illustration/artwork' : 'realistic photograph/cinematic shot'}.
  ${userRequest ? `ADDITIONAL USER REQUEST: ${userRequest}` : ''}
  Do not include any text or UI elements. Focus on high contrast and professional quality.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }
  
  return imageUrl;
};
