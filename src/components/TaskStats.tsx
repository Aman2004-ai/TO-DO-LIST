import React from 'react';
import { type TaskItem } from '../types';
import { CheckCircle, Clock, ListTodo } from 'lucide-react';

interface TaskStatsProps {
  tasks: TaskItem[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div id="task-stats-panel" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <ListTodo className="w-3.5 h-3.5 text-slate-600" />
              <span>Total</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{total}</p>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-700 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending</span>
            </div>
            <p className="text-xl font-bold text-amber-900">{pending}</p>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-emerald-700 font-medium mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Done</span>
            </div>
            <p className="text-xl font-bold text-emerald-900">{completed}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="sm:max-w-xs w-full flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5">
            <span className="font-medium">Completion Progress</span>
            <span className="font-bold text-slate-900">{percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
