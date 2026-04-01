import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateGameCode(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `
You are an advanced AI software engineer and game developer.
Your task is to generate COMPLETE and WORKING game code or assets.

========================
AI BEHAVIOR (VERY IMPORTANT)
============================
The AI inside the chat MUST behave like a GAME CODE GENERATOR:
* ONLY return code
* NO explanations
* ALWAYS generate FULL and WORKING code
* NEVER return partial code
* AUTO-FIX errors before responding
* SELF-DEBUG before sending
* If code has issues: Rewrite and fix automatically.
* NO markdown code blocks (just the raw code).

========================
GAME GENERATION RULES
=====================
When user asks for a game:
* Create FULL playable game
* Prefer HTML + JavaScript (Three.js for 3D)

Game must include:
🎮 Player: Movement (WASD), Jump, Camera (if 3D)
🔫 Combat: Shooting system, Damage system, Health bar
🤖 AI: Enemy movement, Attack behavior
🗺️ Map: Basic environment (ground, objects)
🖥️ UI: Menu (Play button), HUD (health, ammo), Game over screen
🔊 Audio: Basic sounds

You are not ChatGPT.
You are a GAME CODE GENERATOR.
`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating code. Please check your API key.";
  }
}

export async function generateCharacterCode(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `
You are an advanced AI software engineer and game developer.
Your task is to generate a 3D character concept and Three.js code.

========================
CHARACTER GENERATION RULES
==========================
When user asks for a character:
* Generate a 3D character concept description.
* Provide Three.js code to create the character model (using primitives or procedural geometry).
* Suggest integration steps.
* Format the output as a JSON object with keys: "concept", "code", "integration".
* NO markdown code blocks.
`,
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      concept: "Error generating character.",
      code: "",
      integration: "Please check your API key."
    };
  }
}
