// FIX: Removed self-import of `TransactionType` to resolve declaration conflict.
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
  quantity: number;
  labels: string[];
  recurringTransactionId?: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  startDate: string; // YYYY-MM-DD
  frequency: 'monthly';
  dayOfMonth: number; // 1-31
  labels: string[];
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number; // 0-11 for Jan-Dec
  year: number;
}

export interface Saving {
  id: string;
  amount: number;
  month: number; // 0-11 for Jan-Dec
  year: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  isDefault: boolean;
  affectsBudget: boolean;
}

export interface TransactionFormData {
  description: string;
  amount: number;
  quantity: number;
  type: TransactionType;
  category: string;
  date: string; // Used for both single transaction date and recurring start date
  labels: string[];
  isRecurring: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
}

export type TaskStatus = 'new' | 'scheduled' | 'in_progress' | 'completed' | 'backlog';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskRepeat {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  byWeekday?: number[];
  monthlyMode?: 'on_day' | 'last_day';
  dayOfMonth?: number;
  yearlyMode?: 'on_date' | 'last_day_of_month';
  monthOfYear?: number; // 1-12 for Jan-Dec (for yearly recurrence)
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  allDay: boolean;
  start?: string;
  end?: string;
  due?: string;
  repeat?: TaskRepeat | null;
  color?: string;
  labels: string[];
  gcalEventId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  subtasks?: Subtask[];
  progress?: number; // Progress percentage (0-100)
  estimatedTime?: string | null; // Estimated time to complete (e.g., "5 min", "2 hours", "2-3 days")
  taskType?: 'todo' | 'schedule'; // Type of task: 'todo' (short-term) or 'schedule' (long-term)
}

export interface ShoppingItem {
  id: string;
  title: string;
  category?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  completedAt?: string | null;
}
