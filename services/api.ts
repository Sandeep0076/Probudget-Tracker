import { Budget, Category, RecurringTransaction, Saving, Transaction, TransactionFormData, TransactionType, ActivityLog, Task, Subtask } from '../types';

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

const get = <T>(url: string) => fetch(url).then(r => json<T>(r));
const post = <T>(url: string, body: unknown) => fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => json<T>(r));
const put = <T>(url: string, body: unknown) => fetch(url, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => json<T>(r));
const del = <T>(url: string) => fetch(url, { method: 'DELETE' }).then(r => json<T>(r));

export const OVERALL_BUDGET_CATEGORY = '##OVERALL_BUDGET##';

// Transactions
export const getTransactions = () => get<Transaction[]>('/api/transactions');
export const addTransaction = (tx: Omit<Transaction, 'id'>) => post<Transaction>('/api/transactions', tx);
export const updateTransaction = (tx: Transaction) => put<{ ok: boolean }>(`/api/transactions/${tx.id}`, tx);
export const deleteTransaction = (id: string) => del<{ ok: boolean }>(`/api/transactions/${id}`);
export const addMultipleTransactions = (items: Omit<Transaction, 'id'>[]) => post<{ ok: boolean }>('/api/transactions/bulk', items);

// Budgets
export const getBudgets = () => get<Budget[]>('/api/budgets');
export const addCategoryBudget = (data: Omit<Budget, 'id'>) => post<Budget>('/api/budgets/category', data);
export const updateCategoryBudget = (id: string, amount: number) => put<{ ok: boolean }>(`/api/budgets/${id}`, { amount });
export const addOrUpdateOverallBudget = (data: { amount: number; month: number; year: number }) => post<Budget>('/api/budgets/overall', data);

// Categories
export const getCategories = () => get<Category[]>('/api/categories');
export const addCategory = (category: Omit<Category, 'id' | 'isDefault'>) => post<Category>('/api/categories', category);
export const updateCategory = (id: string, newName: string, oldName: string) => put<{ ok: boolean }>(`/api/categories/${id}`, { newName, oldName });
export const deleteCategory = (id: string) => del<{ ok: boolean }>(`/api/categories/${id}`);

// Recurring
export const getRecurringTransactions = () => get<RecurringTransaction[]>('/api/recurring');
export const addRecurringTransaction = (r: Omit<RecurringTransaction, 'id'>) => post<RecurringTransaction>('/api/recurring', r);
export const deleteRecurringTransaction = (id: string) => del<{ ok: boolean }>(`/api/recurring/${id}`);
export const generateDueRecurringTransactions = () => post<{ generated: number }>(`/api/recurring/generate-due`, {});

// Savings
export const getSavings = () => get<Saving[]>('/api/savings');
export const addOrUpdateSaving = (s: { amount: number; month: number; year: number }) => post<Saving>('/api/savings/upsert', s);

// Activity Log
export const getActivityLog = () => get<ActivityLog[]>('/api/activity');

// Settings
export const getSettings = () => get<{ theme: string; customThemeColor: string; username: string; password: string }>(`/api/settings`);
export const setSettings = (theme: string, customThemeColor: string, username: string, password: string) => post<{ ok: boolean }>(`/api/settings`, { theme, customThemeColor, username, password });

// Planner: Tasks
export const getTasks = () => get<Task[]>('/api/tasks');
export const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'> & { subtasks?: Subtask[] }) => post<{ id: string }>(`/api/tasks`, task);
export const updateTask = (id: string, task: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => put<{ ok: boolean }>(`/api/tasks/${id}`, task);
export const deleteTask = (id: string) => del<{ ok: boolean }>(`/api/tasks/${id}`);
export const getAgenda = (range: 'today'|'week'|'overdue') => get<any[]>(`/api/tasks/agenda?range=${range}`);

// Calendar integration
export const getCalendarAuthUrl = () => get<{ url: string }>(`/api/calendar/auth-url`);
export const listCalendarEvents = (timeMin: string, timeMax: string) => get<any[]>(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
export const listGoogleTasks = () => get<any[]>(`/api/google-tasks`);
export const toggleGoogleTask = (taskId: string, currentStatus: string) => put<any>(`/api/google-tasks/${taskId}/toggle`, { currentStatus });
export const disconnectCalendar = () => get<{ ok: boolean }>(`/api/calendar/disconnect`);
export const toggleCalendarEvent = (eventId: string, currentStatus: string) => put<any>(`/api/calendar/events/${eventId}/toggle`, { currentStatus });
