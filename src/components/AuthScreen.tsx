import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div id="auth-screen-container" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            TaskVault
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your personal, cloud-synchronized to-do list powered by Firebase
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {error && (
            <div id="auth-error-banner" className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <span className="shrink-0 text-red-500 font-bold">!</span>
              <div>
                <p className="font-medium text-red-800">Authentication Notice</p>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              id="google-signin-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base transition-all duration-150 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.39 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Isolated & Private Data</p>
                <p className="text-xs text-slate-500">
                  Firebase Security Rules strictly isolate tasks. Only your authenticated account can access or modify your records.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Real-Time Cloud Synchronization</p>
                <p className="text-xs text-slate-500">
                  Tasks update instantaneously across all sessions via Cloud Firestore snapshot listeners.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Organized Productivity</p>
                <p className="text-xs text-slate-500">
                  Categorize items, set priorities, manage due dates, and track your completion progress.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Secured with Google Identity & Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
};
