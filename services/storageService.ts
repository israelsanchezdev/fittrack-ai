import { supabase } from './supabaseClient';
import { Workout, User } from '../types';

// Helper to map a profile row to our User type
const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  name: profile.full_name,
  username: profile.username,
  avatar: profile.avatar_url,
  joinedDate: profile.updated_at || new Date().toISOString(),
});

// --- Auth Functions ---

export const registerUser = async (
  email: string,
  name: string,
  username: string,
  password: string
): Promise<User> => {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    username
  )}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        username,
        avatar_url: avatarUrl,
      },
    },
  });

  if (error || !data.user) {
    console.error(error);
    throw new Error(error?.message || 'Failed to register user');
  }

  // Try to read profile row created by trigger
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profile && !profileError) {
    return mapProfileToUser(profile);
  }

  // Fallback to auth metadata if profile not ready yet
  return {
    id: data.user.id,
    name: (data.user.user_metadata as any)?.full_name || name,
    username: (data.user.user_metadata as any)?.username || username,
    avatar: (data.user.user_metadata as any)?.avatar_url || avatarUrl,
    joinedDate: new Date().toISOString(),
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.error(error);
    throw new Error(error?.message || 'Invalid email or password');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profile && !profileError) {
    return mapProfileToUser(profile);
  }

  return {
    id: data.user.id,
    name: (data.user.user_metadata as any)?.full_name || 'User',
    username: (data.user.user_metadata as any)?.username || 'user',
    avatar: (data.user.user_metadata as any)?.avatar_url || '',
    joinedDate: new Date().toISOString(),
  };
};

export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentSession = async (): Promise<User | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    return mapProfileToUser(profile);
  }

  return null;
};

/**
 * Upload a new avatar image to Supabase Storage and update the profile.
 * Requires a public bucket called "avatars".
 *
 * If anything fails, this throws an error and the caller (UI) keeps
 * the previous avatar as a fallback.
 */
export const uploadAvatar = async (file: File): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user');
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error(uploadError);
    throw new Error('Failed to upload avatar. Your previous avatar is still in place.');
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData?.publicUrl;
  if (!publicUrl) {
    throw new Error('Could not get public URL for avatar. Your previous avatar is still in place.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
    .select('*')
    .single();

  if (profileError || !profile) {
    console.error(profileError);
    throw new Error('Failed to update avatar profile. Your previous avatar is still in place.');
  }

  return mapProfileToUser(profile);
};

// --- Data Functions ---

export const getWorkouts = async (): Promise<Workout[]> => {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      `
      id,
      user_id,
      name,
      date,
      notes,
      profiles:user_id (
        username
      ),
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
    `
    )
    .order('date', { ascending: false });

  if (error || !data) {
    console.error(error);
    throw new Error(error?.message || 'Failed to load workouts');
  }

  return data.map((w: any) => ({
    id: w.id,
    userId: w.user_id,
    userName: w.profiles?.username || 'Unknown',
    name: w.name,
    date: w.date,
    notes: w.notes || '',
    exercises: (w.exercises || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      sets: (e.workout_sets || []).map((s: any) => ({
        id: s.id,
        reps: Number(s.reps),
        weight: Number(s.weight),
        completed: !!s.completed,
      })),
    })),
  }));
};

export const saveWorkout = async (workout: Workout): Promise<void> => {
  // 1. Insert workout
  const { data: workoutData, error: wError } = await supabase
    .from('workouts')
    .insert({
      user_id: workout.userId,
      name: workout.name,
      date: workout.date,
      notes: workout.notes || null,
    })
    .select()
    .single();

  if (wError || !workoutData) {
    console.error(wError);
    throw wError || new Error('Failed to save workout');
  }

  // 2. Insert exercises
  const exercisesToInsert = workout.exercises.map((ex, idx) => ({
    workout_id: workoutData.id,
    name: ex.name,
    order_index: idx,
  }));

  const { data: exercisesData, error: eError } = await supabase
    .from('exercises')
    .insert(exercisesToInsert)
    .select();

  if (eError || !exercisesData) {
    console.error(eError);
    throw eError || new Error('Failed to save exercises');
  }

  // 3. Insert sets
  let setsToInsert: any[] = [];

  workout.exercises.forEach((ex, index) => {
    const createdExercise = exercisesData[index];
    if (!createdExercise) return;

    const exSets = ex.sets.map((s) => ({
      exercise_id: createdExercise.id,
      reps: s.reps,
      weight: s.weight,
      completed: s.completed,
    }));

    setsToInsert = [...setsToInsert, ...exSets];
  });

  if (setsToInsert.length > 0) {
    const { error: sError } = await supabase
      .from('workout_sets')
      .insert(setsToInsert);

    if (sError) {
      console.error(sError);
      throw sError;
    }
  }
};
