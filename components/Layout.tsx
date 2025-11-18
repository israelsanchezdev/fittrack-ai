import React from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, PlusCircle, History, Sparkles, LogOut, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onChangeView, 
  currentUser, 
  onLogout,
  children 
}) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.LOG_WORKOUT, label: 'Log Workout', icon: PlusCircle },
    { id: ViewState.HISTORY, label: 'History', icon: History },
    { id: ViewState.AI_COACH, label: 'AI Coach', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            FitTrack AI
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-700 bg-gray-850">
          <div className="flex items-center gap-3 mb-4 px-2">
             <img 
               src={currentUser.avatar} 
               alt={currentUser.name} 
               className="w-10 h-10 rounded-full bg-gray-600 border-2 border-indigo-500" 
             />
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
               <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
             </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50 flex justify-around p-3 safe-area-pb">
        {navItems.map((item) => (
          <button
             key={item.id}
             onClick={() => onChangeView(item.id)}
             className={`flex flex-col items-center gap-1 ${
               currentView === item.id ? 'text-indigo-400' : 'text-gray-500'
             }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
        <button
           onClick={onLogout}
           className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-400"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px]">Exit</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mb-16 md:mb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};