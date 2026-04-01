import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateGameCode = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Create a COMPLETE, PROFESSIONAL, and FULLY WORKING game based on this prompt: "${prompt}".
    
    STRICT RULES:
    - ONLY return the HTML/CSS/JS code in a single block.
    - Use Three.js for 3D games if requested or appropriate.
    - Include player movement (WASD), camera, enemies, shooting, health, and UI.
    - The game must be self-contained and run in an iframe.
    - No explanations, no markdown code blocks, just the raw HTML content.`,
  });
  return response.text || "";
};

export const generateCharacterCode = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Create a 3D character preview in Three.js based on: "${prompt}".
    
    STRICT RULES:
    - Return a COMPLETE HTML file with Three.js included via CDN.
    - The character should be centered, rotating, and well-lit.
    - Use a dark background.
    - No explanations, no markdown code blocks, just the raw HTML content.`,
  });
  return response.text || "";
};

export const generateMapCode = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Create a 3D environment/map preview in Three.js based on: "${prompt}".
    
    STRICT RULES:
    - Return a COMPLETE HTML file with Three.js included via CDN.
    - Include a ground, sky, and some environmental elements (trees, buildings, etc.).
    - Include a simple orbit camera.
    - No explanations, no markdown code blocks, just the raw HTML content.`,
  });
  return response.text || "";
};

export const chatWithAI = async (message: string, history: { role: string; parts: string }[]) => {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "You are an elite game developer. You only respond with code or technical solutions. No small talk.",
    },
  });
  
  const response = await chat.sendMessage({ message });
  return response.text;
};
