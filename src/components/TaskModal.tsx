import React, { useState, useEffect } from 'react';
import { type TaskItem, type Priority, type Category } from '../types';
import { X, Calendar, Tag, AlertTriangle } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    priority: Priority;
    category: Category;
    dueDate: string;
  }) => Promise<void>;
  initialTask?: TaskItem | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('General');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setCategory(initialTask.category);
      setDueDate(initialTask.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('General');
      setDueDate('');
    }
    setValidationError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="task-modal-dialog"
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            id="task-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review project deliverables"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 transition"
              autoFocus
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="task-description-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              id="task-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details, sub-tasks, or notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 transition resize-y"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-category-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Category
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 bg-white cursor-pointer"
              >
                <option value="General">General</option>
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Errands">Errands</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-priority-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 bg-white cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="task-duedate-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Due Date
            </label>
            <input
              id="task-duedate-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 bg-white cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              id="task-modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="task-modal-save-btn"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>{initialTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
