import React, { useMemo } from 'react';
import { Workout, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, TrendingUp, Dumbbell, Activity } from 'lucide-react';

interface DashboardProps {
  workouts: Workout[];
  currentUser: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ workouts, currentUser }) => {
  
  // Filter workouts for current user for the stats, but maybe show feed of all? 
  // Let's show stats for current user.
  const userWorkouts = useMemo(() => 
    workouts.filter(w => w.userId === currentUser.id), 
  [workouts, currentUser.id]);

  const recentActivity = useMemo(() => 
    workouts.slice(0, 5), 
  [workouts]);

  const stats = useMemo(() => {
    const totalWorkouts = userWorkouts.length;
    const totalVolume = userWorkouts.reduce((acc, w) => {
      return acc + w.exercises.reduce((exAcc, ex) => {
        return exAcc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0);
      }, 0);
    }, 0);
    
    // Volume by day for chart (last 7 workouts)
    const chartData = userWorkouts.slice(0, 7).reverse().map(w => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0)
    }));

    return { totalWorkouts, totalVolume, chartData };
  }, [userWorkouts]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Welcome back, {currentUser.name.split(' ')[0]}</h2>
        <span className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between pb-4">
            <div className="text-gray-400 text-sm font-medium">Total Workouts</div>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalWorkouts}</div>
          <div className="text-xs text-gray-500 mt-1">Lifetime logged sessions</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between pb-4">
            <div className="text-gray-400 text-sm font-medium">Volume Lifted</div>
            <Dumbbell className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">{(stats.totalVolume / 1000).toFixed(1)}k <span className="text-sm font-normal text-gray-500">lbs</span></div>
          <div className="text-xs text-gray-500 mt-1">Accumulated weight moved</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between pb-4">
            <div className="text-gray-400 text-sm font-medium">Last Session</div>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {userWorkouts.length > 0 ? userWorkouts[0].name : 'No workouts yet'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {userWorkouts.length > 0 ? new Date(userWorkouts[0].date).toDateString() : 'Start tracking today'}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Volume Progress (Last 7 Sessions)
          </h3>
          <div className="h-[300px] w-full">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                    itemStyle={{ color: '#818CF8' }}
                    cursor={{fill: '#374151', opacity: 0.4}}
                  />
                  <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No sufficient data to display chart
              </div>
            )}
          </div>
        </div>

        {/* Community Feed */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Community Feed</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 && <p className="text-gray-500">No activity yet.</p>}
            {recentActivity.map((workout) => (
              <div key={workout.id} className="flex items-start space-x-3 pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                  {/* In a real app, we would look up the user by ID to get the avatar, 
                      but we denormalized data for simplicity or need to pass users map */}
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-indigo-400 bg-gray-900">
                     {workout.userName.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    <span className="text-indigo-400">{workout.userName}</span> completed <span className="text-gray-200">{workout.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(workout.date).toLocaleString()} • {workout.exercises.length} exercises
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
