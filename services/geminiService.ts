import { GoogleGenAI, Type } from "@google/genai";
import { Workout, Exercise } from '../types';

// Safe access to API Key for Vite (import.meta.env) and Node (process.env) environments
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY;
  }
  return undefined;
};

// Initialize the client with the resolved key
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateWorkoutPlan = async (prompt: string): Promise<string> => {
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