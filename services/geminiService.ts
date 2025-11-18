import { GoogleGenAI, Type } from "@google/genai";
import { Workout, Exercise } from '../types';

// Access API Key from Vite Environment Variables
const apiKey = (import.meta as any).env?.VITE_API_KEY || '';

// Initialize the client
// Note: If apiKey is missing, requests will fail. We rely on the Auth/Config flow or Vercel Env Vars to provide it.
const ai = new GoogleGenAI({ apiKey });

export const generateWorkoutPlan = async (prompt: string): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure it in settings or Vercel dashboard.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert elite fitness coach. Create detailed, science-based workout plans. Be encouraging but concise. Use Markdown formatting for lists and bold text.",
      }
    });
    
    return response.text || "Could not generate a workout plan. Please try again.";
  } catch (error) {
    console.error("Error generating workout:", error);
    return "Sorry, I encountered an error while communicating with the AI coach.";
  }
};

export const analyzeWorkoutHistory = async (workouts: Workout[]): Promise<string> => {
  if (!apiKey) return "API Key is missing.";

  const summary = workouts.slice(0, 5).map(w => ({
    date: w.date,
    name: w.name,
    totalExercises: w.exercises.length,
    volume: w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0)
  }));

  const prompt = `Analyze my recent workout history and give me 3 specific tips to improve. Here is the data JSON: ${JSON.stringify(summary)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a data-driven sports scientist. Analyze the user's recent volume and frequency. Keep advice actionable and brief.",
      }
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Error analyzing workouts:", error);
    return "Unable to analyze history at this time.";
  }
};

export const suggestExercises = async (muscleGroup: string): Promise<string[]> => {
  if (!apiKey) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest 5 best exercises for ${muscleGroup}. Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    return JSON.parse(jsonText) as string[];
  } catch (error) {
    console.error("Error suggesting exercises:", error);
    return [];
  }
};
