import React, { useRef, useState } from 'react';
import { ViewState, User } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { uploadAvatar } from '../services/storageService';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems = [
  { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: ViewState.LOG_WORKOUT, label: 'Log Workout', icon: PlusCircle },
  { id: ViewState.HISTORY, label: 'History', icon: History },
  { id: ViewState.AI_COACH, label: 'AI Coach', icon: Sparkles },
];

// Max avatar size in MB
const MAX_AVATAR_SIZE_MB = 2;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onChangeView,
  currentUser,
  onLogout,
  children,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic type check
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc). Your old avatar is unchanged.');
      event.target.value = '';
      return;
    }

    // Size check
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      alert(
        `Please choose an image smaller than ${MAX_AVATAR_SIZE_MB}MB. Your old avatar is unchanged.`
      );
      event.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      await uploadAvatar(file);
      // Only reload on success so we get the new avatar
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message ||
          'Could not update avatar. Your previous avatar is still in place.'
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onChangeView(item.id)}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        {/* Brand */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xl font-black">🏋️‍♂️</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">
              FitTrack AI
            </p>
            <p className="text-xs text-gray-500">Smarter workout logging</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">{navItems.map(renderNavItem)}</nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80">
          {/* Hidden file input for avatar uploads */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="flex items-center gap-3 mb-2 px-1">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative"
              title="Change avatar"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full bg-gray-700 border-2 border-indigo-500 object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-[10px] text-white">
                  Uploading…
                </div>
              )}
            </button>

            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAvatarClick}
            className="text-xs text-indigo-400 hover:text-indigo-300 px-1 mb-3 underline"
          >
            Change avatar
          </button>

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
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden items-center justify-between bg-gray-950/95 border-t border-gray-800 px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center gap-1 ${
                isActive ? 'text-indigo-400' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">Exit</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mb-16 md:mb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
