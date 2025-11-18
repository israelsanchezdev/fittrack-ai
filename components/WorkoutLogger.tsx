import React, { useState, useCallback } from 'react';
import { User, Exercise, Workout, WorkoutSet } from '../types';
import { Button } from './Button';
import { Plus, Trash2, Save, Dumbbell } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutLoggerProps {
  currentUser: User;
  onSave: (workout: Workout) => Promise<void>;
  onCancel: () => void;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ currentUser, onSave, onCancel }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addExercise = () => {
    const newExercise: Exercise = {
      id: uuidv4(),
      name: '',
      sets: [
        { id: uuidv4(), reps: 0, weight: 0, completed: false }
      ]
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, name } : ex));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const previousSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: uuidv4(), 
            reps: previousSet ? previousSet.reps : 0, 
            weight: previousSet ? previousSet.weight : 0, 
            completed: false 
          }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }));
  };

  const handleSubmit = async () => {
    if (!workoutName.trim()) {
      alert("Please give your workout a name");
      return;
    }
    if (exercises.length === 0) {
      alert("Please add at least one exercise");
      return;
    }

    setIsSaving(true);
    const workout: Workout = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      date: new Date().toISOString(),
      name: workoutName,
      exercises,
      notes
    };

    try {
      await onSave(workout);
    } catch (error) {
      console.error("Failed to save workout", error);
      alert("Failed to save workout to database.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-800 md:rounded-xl shadow-xl border-y md:border border-gray-700 overflow-hidden min-h-[calc(100vh-100px)] md:min-h-0 pb-20 md:pb-0">
      <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="text-indigo-500" /> Log Workout
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>Cancel</Button>
      </div>
      
      <div className="p-4 md:p-6 space-y-6">
        {/* Workout Details */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Workout Name</label>
          <input 
            type="text" 
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Monday Chest & Triceps"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            disabled={isSaving}
          />
        </div>

        {/* Exercises List */}
        <div className="space-y-6">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-gray-900/50 rounded-lg p-3 md:p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="bg-indigo-600 text-xs font-bold px-2 py-1 rounded text-white">#{index + 1}</span>
                  <input 
                    type="text" 
                    value={exercise.name}
                    onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                    placeholder="Exercise Name"
                    className="bg-transparent border-b border-gray-600 text-lg font-medium text-white focus:border-indigo-500 outline-none w-full mr-4 py-1"
                    disabled={isSaving}
                  />
                </div>
                <button 
                  onClick={() => removeExercise(exercise.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-2"
                  disabled={isSaving}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Sets Header */}
              <div className="grid grid-cols-12 gap-2 mb-2 text-xs uppercase text-gray-500 font-semibold text-center">
                <div className="col-span-2">Set</div>
                <div className="col-span-4">lbs</div>
                <div className="col-span-4">Reps</div>
                <div className="col-span-2"></div>
              </div>

              {/* Sets Rows */}
              <div className="space-y-3">
                {exercise.sets.map((set, sIndex) => (
                  <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs">
                        {sIndex + 1}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number" 
                        value={set.weight || ''} 
                        onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-2 md:py-1 text-center text-white text-base md:text-sm focus:border-indigo-500 outline-none"
                        placeholder="0"
                        disabled={isSaving}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number" 
                        value={set.reps || ''} 
                        onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseFloat(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-2 md:py-1 text-center text-white text-base md:text-sm focus:border-indigo-500 outline-none"
                        placeholder="0"
                        disabled={isSaving}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button 
                        onClick={() => removeSet(exercise.id, set.id)}
                        className="text-gray-600 hover:text-red-400 p-2"
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => addSet(exercise.id)}
                className="mt-4 w-full py-2 rounded border border-dashed border-gray-600 text-xs font-medium text-indigo-400 hover:bg-gray-800 hover:text-indigo-300 flex items-center justify-center gap-1 transition-colors"
                disabled={isSaving}
              >
                <Plus className="w-3 h-3" /> Add Set
              </button>
            </div>
          ))}

          <Button variant="secondary" className="w-full border-dashed border-2 border-gray-600 bg-transparent py-3" onClick={addExercise} disabled={isSaving}>
            <Plus className="w-4 h-4 mr-2" /> Add Exercise
          </Button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any pain?"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-20 resize-none text-base md:text-sm"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="p-4 md:p-6 border-t border-gray-700 bg-gray-800 flex justify-end gap-3 sticky bottom-0 z-10">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Discard</Button>
        <Button onClick={handleSubmit} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" /> Save Workout
        </Button>
      </div>
    </div>
  );
};