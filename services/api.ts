import { Budget, Category, RecurringTransaction, Saving, Transaction, TransactionFormData, TransactionType, ActivityLog, Task, Subtask, ShoppingItem } from '../types';

// Get API base URL from environment variable or default to current origin
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    // Try to get error details from response body
    let errorMessage = `${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      }
    } catch (e) {
      // If parsing fails, use default error message
    }
    console.error('[API] Request failed:', errorMessage);
    throw new Error(errorMessage);
  }
  return res.json();
};

const get = <T>(url: string) => fetch(`${API_BASE_URL}${url}`).then(r => json<T>(r));
const post = <T>(url: string, body: unknown) => fetch(`${API_BASE_URL}${url}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => json<T>(r));
const put = <T>(url: string, body: unknown) => fetch(`${API_BASE_URL}${url}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => json<T>(r));
const del = <T>(url: string) => fetch(`${API_BASE_URL}${url}`, { method: 'DELETE' }).then(r => json<T>(r));

export const OVERALL_BUDGET_CATEGORY = '##OVERALL_BUDGET##';

// Transactions
export const getTransactions = () => get<Transaction[]>('/api/transactions');
export const addTransaction = (tx: Omit<Transaction, 'id'>) => post<Transaction>('/api/transactions', tx);
export const updateTransaction = (tx: Transaction) => put<{ ok: boolean }>(`/api/transactions/${tx.id}`, tx);
export const deleteTransaction = (id: string) => del<{ ok: boolean }>(`/api/transactions/${id}`);
export const addMultipleTransactions = (items: Omit<Transaction, 'id'>[]) => {
  console.log('[API] addMultipleTransactions called with', items.length, 'items');
  console.log('[API] API_BASE_URL:', API_BASE_URL);
  console.log('[API] First item sample:', items.length > 0 ? JSON.stringify(items[0]) : 'none');
  return post<{ ok: boolean }>('/api/transactions/bulk', items);
};

// Budgets
export const getBudgets = () => get<Budget[]>('/api/budgets');
export const addCategoryBudget = (data: Omit<Budget, 'id'>) => post<Budget>('/api/budgets/category', data);
export const updateCategoryBudget = (id: string, amount: number) => put<{ ok: boolean }>(`/api/budgets/${id}`, { amount });
export const addOrUpdateOverallBudget = (data: { amount: number; month: number; year: number }) => post<Budget>('/api/budgets/overall', data);

// Categories
export const getCategories = () => get<Category[]>('/api/categories');
export const addCategory = (category: Omit<Category, 'id' | 'isDefault'>) => post<Category>('/api/categories', category);
export const updateCategory = (id: string, newName: string, oldName: string, affectsBudget?: boolean) => put<{ ok: boolean }>(`/api/categories/${id}`, { newName, oldName, affectsBudget });
export const deleteCategory = (id: string) => del<{ ok: boolean }>(`/api/categories/${id}`);

// Labels
export const getLabels = () => get<string[]>('/api/labels');

// Recurring
export const getRecurringTransactions = () => get<RecurringTransaction[]>('/api/recurring');
export const addRecurringTransaction = (r: Omit<RecurringTransaction, 'id'>) => post<RecurringTransaction>('/api/recurring', r);
export const updateRecurringTransaction = (r: RecurringTransaction) => put<RecurringTransaction>(`/api/recurring/${r.id}`, r);
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
export const getAgenda = (range: 'today' | 'week' | 'overdue') => get<any[]>(`/api/tasks/agenda?range=${range}`);
// Trashbox (Tasks)
export const getTrashedTasks = () => get<any[]>(`/api/tasks/trash`);
export const restoreTask = (id: string) => post<{ ok: boolean }>(`/api/tasks/${id}/restore`, {});
export const permanentlyDeleteTask = (id: string) => del<{ ok: boolean }>(`/api/tasks/${id}/permanent`);
export const purgeOldTasks = () => post<{ ok: boolean }>(`/api/tasks/purge-old`, {});
export const purgeCompletedTasks = () => post<{ ok: boolean; deleted: number }>(`/api/tasks/purge-completed`, {});

// Planner: Shopping List
export const getShoppingItems = () => get<ShoppingItem[]>('/api/shopping-items');
export const addShoppingItem = (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => post<{ id: string }>('/api/shopping-items', item);
export const updateShoppingItem = (id: string, item: Partial<Omit<ShoppingItem, 'id' | 'createdAt'>>) => put<{ ok: boolean }>(`/api/shopping-items/${id}`, item);
export const deleteShoppingItem = (id: string) => del<{ ok: boolean }>(`/api/shopping-items/${id}`);

// Calendar integration
// Calendar integration
// Google integration removed by user request
// export const getCalendarAuthUrl = () => get<{ url: string }>(`/api/calendar/auth-url`);
// export const getCalendarStatus = () => get<{ connected: boolean; needs_refresh: boolean }>(`/api/calendar/status`);
// export const listCalendarEvents = (timeMin: string, timeMax: string) => get<any[]>(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
// export const listGoogleTasks = () => get<any[]>(`/api/google-tasks`);
// export const toggleGoogleTask = (taskId: string, currentStatus: string) => put<any>(`/api/google-tasks/${taskId}/toggle`, { currentStatus });
// export const disconnectCalendar = () => get<{ ok: boolean }>(`/api/calendar/disconnect`);
// export const toggleCalendarEvent = (eventId: string, currentStatus: string) => put<any>(`/api/calendar/events/${eventId}/toggle`, { currentStatus });
// export const syncGoogleData = () => post<{ ok: boolean; created: number; errors: string[] }>('/api/sync-google', {});

// Authentication
export const login = (username: string, password: string) => post<{ success: boolean; username: string }>('/api/auth/login', { username, password });
export const verifySecurityQuestion = (username: string, answer: string) => post<{ success: boolean; securityQuestion: string }>('/api/auth/verify-security-question', { username, answer });
export const resetPassword = (username: string, newPassword: string) => post<{ success: boolean }>('/api/auth/reset-password', { username, newPassword });

// Admin
export const runMigration = () => post<{ ok: boolean; results: any[] }>('/api/admin/run-migration', {});
