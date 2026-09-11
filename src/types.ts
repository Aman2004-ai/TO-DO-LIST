export type Priority = 'low' | 'medium' | 'high';
export type Category = 'Personal' | 'Work' | 'Study' | 'Errands' | 'General';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export type StatusFilter = 'all' | 'active' | 'completed';
export type SortOption = 'newest' | 'oldest' | 'dueDate' | 'priority';

export type ChatRoleKey = 'general' | 'fast' | 'complex';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
}
