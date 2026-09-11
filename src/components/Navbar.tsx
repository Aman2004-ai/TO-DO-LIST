import React from 'react';
import { type User } from '../firebase';
import { CheckCircle2, LogOut, Shield, Sparkles } from 'lucide-react';

interface NavbarProps {
  user: User;
  onSignOut: () => void;
  onOpenChat: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, onOpenChat, isSyncing = false }) => {
  const userInitials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : (user.email ? user.email[0].toUpperCase() : 'U');

  return (
    <header id="app-navbar" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">TaskVault</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Shield className="w-3 h-3" />
                Isolated Vault
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Firebase Real-time Storage</p>
          </div>
        </div>

        {/* Sync Status, AI Chat Button & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Gemini AI Assistant Button */}
          <button
            id="navbar-gemini-chat-btn"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Open Gemini AI Productivity Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>AI Assistant</span>
          </button>

          {/* Cloud Sync Pulse */}
          <div
            id="sync-status-indicator"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
            title={isSyncing ? "Syncing changes..." : "All changes saved to Firestore"}
          >
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Cloud Synced'}</span>
          </div>

          {/* User Details */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  id="user-profile-avatar"
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div
                  id="user-profile-initials"
                  className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200"
                >
                  {userInitials}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                  {user.displayName || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                  {user.email || ''}
                </p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              id="sign-out-btn"
              onClick={onSignOut}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
