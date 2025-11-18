import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { WorkoutLogger } from './components/WorkoutLogger';
import { AiCoach } from './components/AiCoach';
import { Auth } from './components/Auth';
import { ViewState, User, Workout } from './types';
import { getWorkouts, getCurrentSession, logoutUser, saveWorkout } from './services/storageService';
import { History } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentSession();
        setCurrentUserState(user);
        
        if (user) {
          const fetchedWorkouts = await getWorkouts();
          setWorkouts(fetchedWorkouts);
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUserState(user);
    setIsLoading(true);
    const fetchedWorkouts = await getWorkouts();
    setWorkouts(fetchedWorkouts);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUserState(null);
    setWorkouts([]);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleSaveWorkout = async (workout: Workout) => {
    await saveWorkout(workout);
    // Refresh workouts
    const fetchedWorkouts = await getWorkouts();
    setWorkouts(fetchedWorkouts);
    setCurrentView(ViewState.DASHBOARD);
  };

  if (isLoading) {
    return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-indigo-500">Loading...</div>;
  }

  if (!currentUser) {
    return <Auth onAuthSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      currentView={currentView}
      onChangeView={setCurrentView}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {currentView === ViewState.DASHBOARD && (
        <Dashboard workouts={workouts} currentUser={currentUser} />
      )}

      {currentView === ViewState.LOG_WORKOUT && (
        <WorkoutLogger 
          currentUser={currentUser} 
          onSave={handleSaveWorkout}
          onCancel={() => setCurrentView(ViewState.DASHBOARD)}
        />
      )}

      {currentView === ViewState.AI_COACH && (
        <AiCoach workouts={workouts.filter(w => w.userId === currentUser.id)} />
      )}

      {currentView === ViewState.HISTORY && (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="text-indigo-500" /> Workout History
          </h2>
          <div className="space-y-4">
            {workouts
              .filter(w => w.userId === currentUser.id)
              .length === 0 ? (
                <div className="text-gray-500 text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
                  <p className="text-lg">No workouts found.</p>
                  <button 
                    onClick={() => setCurrentView(ViewState.LOG_WORKOUT)}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Log your first workout
                  </button>
                </div>
              ) : (
                workouts
                  .filter(w => w.userId === currentUser.id)
                  .map(workout => (
                  <div key={workout.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{workout.name}</h3>
                        <p className="text-sm text-gray-400">{new Date(workout.date).toLocaleDateString()} @ {new Date(workout.date).toLocaleTimeString()}</p>
                      </div>
                      <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-2 py-1 rounded">
                        {workout.exercises.length} Exercises
                      </span>
                    </div>
                    
                    {workout.notes && (
                      <div className="bg-gray-900/50 p-3 rounded-lg mb-4 text-sm text-gray-400 italic">
                        "{workout.notes}"
                      </div>
                    )}

                    <div className="space-y-3">
                      {workout.exercises.map(ex => (
                        <div key={ex.id} className="border-l-2 border-indigo-500 pl-4">
                          <div className="text-white font-medium">{ex.name}</div>
                          <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                            {ex.sets.map((set, idx) => (
                              <span key={set.id} className="bg-gray-700 px-2 py-0.5 rounded text-xs">
                                Set {idx + 1}: <span className="text-white">{set.weight}lbs</span> x {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
