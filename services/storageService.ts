import { supabase } from './supabaseClient';
import { Workout, User, Exercise, WorkoutSet } from '../types';

// --- Auth Functions ---

export const registerUser = async (email: string, name: string, username: string, password: string): Promise<User> => {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        username: username,
        avatar_url: avatarUrl
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Registration failed");

  // Return mapped user
  return {
    id: data.user.id,
    name: name,
    username: username,
    avatar: avatarUrl,
    joinedDate: new Date().toISOString()
  };
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.user) throw new Error("Login failed");

  // Fetch profile details since Auth user object doesn't have custom fields at top level easily
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    // Fallback if profile trigger failed or hasn't run yet (rare)
    return {
      id: data.user.id,
      name: data.user.user_metadata.full_name || 'User',
      username: data.user.user_metadata.username || 'user',
      avatar: data.user.user_metadata.avatar_url || '',
      joinedDate: new Date().toISOString()
    };
  }

  return {
    id: profile.id,
    name: profile.full_name,
    username: profile.username,
    avatar: profile.avatar_url,
    joinedDate: profile.updated_at || new Date().toISOString()
  };
};

export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentSession = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    return {
      id: profile.id,
      name: profile.full_name,
      username: profile.username,
      avatar: profile.avatar_url,
      joinedDate: profile.updated_at
    };
  }
  return null;
};

// --- Data Functions ---

export const getWorkouts = async (): Promise<Workout[]> => {
  // Fetch workouts with nested exercises and sets
  // Supabase syntax for deep selection
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      user_id,
      name,
      date,
      notes,
      profiles:user_id (username),
      exercises (
        id,
        name,
        workout_sets (
          id,
          reps,
          weight,
          completed
        )
      )
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }

  // Transform Supabase response to our App Type
  return data.map((w: any) => ({
    id: w.id,
    userId: w.user_id,
    userName: w.profiles?.username || 'Unknown',
    name: w.name,
    date: w.date,
    notes: w.notes,
    exercises: w.exercises.map((e: any) => ({
      id: e.id,
      name: e.name,
      sets: e.workout_sets.map((s: any) => ({
        id: s.id,
        reps: Number(s.reps),
        weight: Number(s.weight),
        completed: s.completed
      }))
    }))
  }));
};

export const saveWorkout = async (workout: Workout): Promise<void> => {
  // 1. Insert Workout
  const { data: workoutData, error: wError } = await supabase
    .from('workouts')
    .insert({
      user_id: workout.userId,
      name: workout.name,
      date: workout.date,
      notes: workout.notes
    })
    .select()
    .single();

  if (wError || !workoutData) throw wError;

  // 2. Insert Exercises
  const exercisesToInsert = workout.exercises.map((ex, idx) => ({
    workout_id: workoutData.id, // Use the real ID from DB
    name: ex.name,
    order_index: idx
  }));

  const { data: exercisesData, error: eError } = await supabase
    .from('exercises')
    .insert(exercisesToInsert)
    .select();

  if (eError || !exercisesData) throw eError;

  // 3. Insert Sets
  // We need to map the created exercise IDs back to the sets
  let setsToInsert: any[] = [];
  
  // Since we inserted multiple, we need to match them up. 
  // Assumption: The order returned matches the order inserted if we rely on order_index logic, 
  // but to be safe, we iterate through our original array and match by name/index if possible.
  // Simplification: We will loop and insert sets based on the array index match.
  
  workout.exercises.forEach((ex, index) => {
    const createdExercise = exercisesData[index]; // This relies on array order preservation which is generally true for batch insert return in Supabase
    if (createdExercise) {
      const exSets = ex.sets.map(s => ({
        exercise_id: createdExercise.id,
        reps: s.reps,
        weight: s.weight,
        completed: s.completed
      }));
      setsToInsert = [...setsToInsert, ...exSets];
    }
  });

  if (setsToInsert.length > 0) {
    const { error: sError } = await supabase
      .from('workout_sets')
      .insert(setsToInsert);
    
    if (sError) throw sError;
  }
};
