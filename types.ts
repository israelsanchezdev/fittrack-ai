export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LOG_WORKOUT = 'LOG_WORKOUT',
  HISTORY = 'HISTORY',
  AI_COACH = 'AI_COACH'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // In a real app, this would be hashed!
  avatar: string;
  joinedDate: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier display in feeds
  name: string;
  date: string; // ISO string
  exercises: Exercise[];
  notes?: string;
}

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}