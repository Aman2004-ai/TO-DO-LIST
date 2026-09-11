import React, { useState } from 'react';
import { type TaskItem } from '../types';
import {
  Calendar,
  Check,
  Edit3,
  Trash2,
  AlertCircle,
  Tag,
  Clock,
} from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
}

const priorityConfig = {
  high: {
    label: 'High Priority',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

const categoryConfig = {
  Personal: 'bg-purple-50 text-purple-700 border-purple-200',
  Work: 'bg-blue-50 text-blue-700 border-blue-200',
  Study: 'bg-teal-50 text-teal-700 border-teal-200',
  Errands: 'bg-orange-50 text-orange-700 border-orange-200',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const categoryClass = categoryConfig[task.category] || categoryConfig.General;

  const isOverdue =
    Boolean(task.dueDate) &&
    !task.completed &&
    new Date(task.dueDate + 'T23:59:59').getTime() < Date.now();

  const isDueToday =
    Boolean(task.dueDate) &&
    !task.completed &&
    new Date(task.dueDate + 'T00:00:00').toDateString() === new Date().toDateString();

  return (
    <div
      id={`task-item-${task.id}`}
      className={`group relative bg-white rounded-xl border transition-all duration-150 p-4 ${
        task.completed
          ? 'border-slate-200/80 bg-slate-50/60 opacity-80'
          : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Toggle Checkbox */}
        <button
          type="button"
          id={`task-toggle-${task.id}`}
          onClick={() => onToggleComplete(task)}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as completed"}
          className={`shrink-0 w-6 h-6 mt-0.5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50'
          }`}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h3
              className={`text-base font-semibold text-slate-900 break-words ${
                task.completed ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.title}
            </h3>

            {/* Created time timestamp */}
            <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(task.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {task.description && (
            <p
              className={`mt-1 text-sm text-slate-600 whitespace-pre-line break-words ${
                task.completed ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Badges & Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {/* Category Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border font-medium whitespace-nowrap ${categoryClass}`}
            >
              <Tag className="w-3 h-3" />
              {task.category}
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-medium whitespace-nowrap ${priority.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dotClass}`} />
              {priority.label}
            </span>

            {/* Due Date Indicator */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border font-medium whitespace-nowrap ${
                  isOverdue
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : isDueToday
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-red-600" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-500" />
                )}
                <span>
                  {isOverdue
                    ? `Overdue: ${task.dueDate}`
                    : isDueToday
                    ? 'Due Today'
                    : `Due: ${task.dueDate}`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            id={`task-edit-${task.id}`}
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Task"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {isDeleting ? (
            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
              <span className="text-[10px] text-red-700 font-medium px-1">Delete?</span>
              <button
                type="button"
                id={`task-delete-confirm-${task.id}`}
                onClick={() => onDelete(task.id)}
                className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 transition cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                id={`task-delete-cancel-${task.id}`}
                onClick={() => setIsDeleting(false)}
                className="px-1.5 py-0.5 rounded bg-white text-slate-600 text-[10px] border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              id={`task-delete-${task.id}`}
              onClick={() => setIsDeleting(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
