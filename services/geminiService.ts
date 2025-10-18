
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this environment, we assume API_KEY is set.
    console.warn("API_KEY not found in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(",")[1],
      mimeType
    },
  };
}

export const solveMathProblem = async (prompt: string, image?: { base64: string, mimeType: string }): Promise<string> => {
  try {
    const systemInstruction = `You are M.Q.S, a world-class AI math tutor. Your goal is to solve the user's math problem and provide a clear, concise, and easy-to-understand step-by-step explanation.

    Instructions:
    1.  Analyze the problem carefully. If it's an image, first transcribe the problem.
    2.  Solve the problem accurately.
    3.  Break down the solution into logical, numbered steps.
    4.  Explain the reasoning behind each step.
    5.  Clearly state the final answer.
    6.  Format your entire response in Markdown for readability. Use headings for sections like "Problem", "Solution Steps", and "Final Answer". Use bold text for emphasis.`;
    
    let contents;
    if (image) {
      const imagePart = fileToGenerativePart(image.base64, image.mimeType);
      contents = { parts: [{ text: prompt }, imagePart] };
    } else {
      contents = prompt;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while solving the problem: ${error.message}`;
    }
    return "An unknown error occurred while solving the problem.";
  }
};
