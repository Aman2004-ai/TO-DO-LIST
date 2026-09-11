/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from './firebase';
import { type TaskItem, type Priority, type Category, type StatusFilter, type SortOption } from './types';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { TaskStats } from './components/TaskStats';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import {
  Plus,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  ListPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickCategory, setQuickCategory] = useState<Category>('General');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Gemini Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Tasks Subscription
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    // Personal isolated collection for current authenticated user
    const tasksCollection = collection(db, 'users', user.uid, 'tasks');
    const q = query(tasksCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks: TaskItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedTasks.push({
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            completed: Boolean(data.completed),
            priority: data.priority || 'medium',
            category: data.category || 'General',
            dueDate: data.dueDate || '',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            userId: data.userId || user.uid,
          });
        });
        setTasks(loadedTasks);
        setTasksLoading(false);
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        setTasksLoading(false);
        showToast('Firestore sync warning: ' + error.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Google Sign In Handler
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('The sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. Please try again.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google.');
      }
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Quick Add Task Handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickTitle.trim()) return;

    setIsSyncing(true);
    try {
      const tasksCollection = collection(db, 'users', user.uid, 'tasks');
      await addDoc(tasksCollection, {
        title: quickTitle.trim(),
        description: '',
        completed: false,
        priority: quickPriority,
        category: quickCategory,
        dueDate: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user.uid,
      });

      setQuickTitle('');
      showToast('Task added');
    } catch (err: any) {
      console.error('Error adding task:', err);
      showToast('Failed to add task: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Modal Save Task (Create or Update)
  const handleSaveModalTask = async (data: {
    title: string;
    description: string;
    priority: Priority;
    category: Category;
    dueDate: string;
  }) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      if (editingTask) {
        // Update existing task
        const taskRef = doc(db, 'users', user.uid, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          title: data.title,
          description: data.description,
          priority: data.priority,
          category: data.category,
          dueDate: data.dueDate,
          updatedAt: Date.now(),
        });
        showToast('Task updated');
      } else {
        // Create new detailed task
        const tasksCollection = collection(db, 'users', user.uid, 'tasks');
        await addDoc(tasksCollection, {
          title: data.title,
          description: data.description,
          completed: false,
          priority: data.priority,
          category: data.category,
          dueDate: data.dueDate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: user.uid,
        });
        showToast('Task created');
      }
    } catch (err: any) {
      console.error('Save task error:', err);
      throw err;
    } finally {
      setIsSyncing(false);
      setEditingTask(null);
    }
  };

  // Toggle Task Completed
  const handleToggleComplete = async (task: TaskItem) => {
    if (!user) return;
    setIsSyncing(true);
    const nextCompleted = !task.completed;

    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: nextCompleted,
        updatedAt: Date.now(),
      });

      if (nextCompleted) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'],
        });
        showToast('Task marked complete! 🎉');
      }
    } catch (err: any) {
      console.error('Toggle complete error:', err);
      showToast('Failed to update task: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
      showToast('Task deleted');
    } catch (err: any) {
      console.error('Delete task error:', err);
      showToast('Failed to delete task: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Add task suggested by Gemini Copilot
  const handleAddTaskFromChat = async (taskTitle: string) => {
    if (!user || !taskTitle.trim()) return;
    try {
      setIsSyncing(true);
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        title: taskTitle.trim(),
        description: 'Suggested by Gemini AI Copilot',
        completed: false,
        priority: 'medium',
        category: 'General',
        dueDate: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user.uid,
      });
      showToast('Added task from Gemini Copilot! ✨');
    } catch (err: any) {
      console.error('Error adding task from chat:', err);
      showToast('Failed to add task: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter & Sort Logic
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status filter
        if (statusFilter === 'active' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;

        // Category filter
        if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const queryLower = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(queryLower);
          const matchDesc = task.description?.toLowerCase().includes(queryLower);
          return matchTitle || matchDesc;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortBy === 'priority') {
          const weight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        return 0;
      });
  }, [tasks, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Connecting to TaskVault...</p>
        </div>
      </div>
    );
  }

  // Not signed in state
  if (!user) {
    return <AuthScreen onSignIn={handleSignIn} isLoading={authLoading} error={authError} />;
  }

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          id="app-toast"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onOpenChat={() => setIsChatOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Isolation Security Badge */}
        <div
          id="isolation-security-banner"
          className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
        >
          <div className="flex items-center gap-2 text-slate-700">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900">Personal Vault Isolation:</span>{' '}
              <span className="text-slate-600">
                Firestore security rules enforce that only user{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">
                  {user.uid.substring(0, 8)}...
                </code>{' '}
                can read or modify these tasks.
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium whitespace-nowrap self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Database ID: ai-studio
          </span>
        </div>

        {/* Task Overview Stats */}
        <TaskStats tasks={tasks} />

        {/* Quick Add Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                id="quick-task-input"
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="What needs to be done today?"
                className="w-full pl-3.5 pr-20 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <select
                  id="quick-priority-select"
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as Priority)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 border-none rounded py-1 px-1.5 text-slate-700 cursor-pointer outline-hidden font-medium"
                  title="Priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Med</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                id="quick-category-select"
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as Category)}
                className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 cursor-pointer outline-hidden focus:border-indigo-600"
              >
                <option value="General">General</option>
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Errands">Errands</option>
              </select>

              <button
                type="submit"
                id="quick-add-btn"
                disabled={!quickTitle.trim() || isSyncing}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>

              <button
                type="button"
                id="open-detailed-add-modal-btn"
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="p-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm transition cursor-pointer"
                title="Open detailed task form (add notes, due date)"
              >
                <ListPlus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              {(['all', 'active', 'completed'] as StatusFilter[]).map((tab) => {
                const label = tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Completed';
                const count =
                  tab === 'all'
                    ? tasks.length
                    : tab === 'active'
                    ? tasks.filter((t) => !t.completed).length
                    : tasks.filter((t) => t.completed).length;

                return (
                  <button
                    key={tab}
                    id={`filter-tab-${tab}`}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      statusFilter === tab
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        statusFilter === tab ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Sort Toolbar */}
            <div className="flex flex-1 items-center gap-2 justify-end">
              {/* Search Field */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="task-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs text-slate-900 outline-hidden transition"
                />
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                <select
                  id="sort-by-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white cursor-pointer outline-hidden"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* Secondary Filter Chips */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 font-medium mr-1">Category:</span>
              {['all', 'General', 'Personal', 'Work', 'Study', 'Errands'].map((cat) => (
                <button
                  key={cat}
                  id={`cat-filter-${cat}`}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Priority:</span>
              {['all', 'high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  id={`priority-filter-${p}`}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded text-xs font-medium uppercase text-[11px] transition cursor-pointer whitespace-nowrap ${
                    priorityFilter === p
                      ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task List Section */}
        <div id="task-list-container" className="space-y-3">
          {tasksLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Loading your synchronized tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div
              id="empty-tasks-state"
              className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks found'}
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                {tasks.length === 0
                  ? 'Your personal vault is clean! Use the quick input bar above or the + button to add your first task.'
                  : 'Try adjusting your search terms or filters to find what you are looking for.'}
              </p>
              {tasks.length === 0 && (
                <button
                  type="button"
                  id="empty-state-add-btn"
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Task</span>
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleOpenEdit}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TaskVault &bull; Collaborative & Personal To-Do</span>
          <span className="text-slate-400">
            Backed by Cloud Firestore & Google Identity
          </span>
        </div>
      </footer>

      {/* Floating Gemini Chat Trigger */}
      <button
        id="floating-gemini-chat-btn"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group cursor-pointer"
        title="Chat with Gemini AI Copilot"
      >
        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs font-semibold pr-1">Ask Gemini</span>
      </button>

      {/* Gemini Chat Drawer */}
      <GeminiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        tasks={tasks}
        onAddTaskFromChat={handleAddTaskFromChat}
      />

      {/* Detailed Add / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModalTask}
        initialTask={editingTask}
      />
    </div>
  );
}
