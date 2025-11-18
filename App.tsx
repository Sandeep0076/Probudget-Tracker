import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Budgets from './components/Budgets';
import TransactionsPage from './components/TransactionsPage';
import CategoriesPage from './components/CategoriesPage';
import ReportsPage from './components/ReportsPage';
import ReceiptConfirmationPage from './components/ReceiptConfirmationPage';
import SettingsPage from './components/SettingsPage';
import EditTransactionModal from './components/EditTransactionModal';
import LoginPage from './components/LoginPage';
import { Transaction, TransactionType, Budget, Category, RecurringTransaction, TransactionFormData, Saving, ActivityLog, Task, ShoppingItem } from './types';
import * as api from './services/api';
import { applyCustomTheme } from './utils/theme';
import TopSwitcher from './components/TopSwitcher';
import PlannerHeader, { PlannerPage } from './components/planner/PlannerHeader';
import TaskModal from './components/planner/TaskModal';
import PlannerDashboard from './components/planner/PlannerDashboard';
import PlannerBoard from './components/planner/PlannerBoard';
import PlannerCalendar from './components/planner/PlannerCalendar';
import PlannerBacklog from './components/planner/PlannerBacklog';
import PlannerToBuy from './components/planner/PlannerToBuy';
import ShoppingItemModal from './components/ShoppingItemModal';

export type Page = 'dashboard' | 'addTransaction' | 'budgets' | 'transactions' | 'categories' | 'reports' | 'confirmReceipt' | 'settings';
export type Theme = 'dark-blue' | 'light' | 'dark' | 'custom';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [section, setSection] = useState<'budget' | 'planner'>('budget');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [plannerPage, setPlannerPage] = useState<PlannerPage>('dashboard');
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<Budget[]>([]);
  const [overallBudget, setOverallBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [prefillTask, setPrefillTask] = useState<any | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingItem | null>(null);
  
  const [receiptItemsToConfirm, setReceiptItemsToConfirm] = useState<TransactionFormData[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [theme, setTheme] = useState<Theme>('dark-blue');
  const [customThemeColor, setCustomThemeColor] = useState<string>('#5e258a');
  const [username, setUsername] = useState<string>('Mr and Mrs Pathania');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    // Clear any inline styles first, then set the class name or apply new styles.
    document.documentElement.style.cssText = '';
    document.documentElement.className = '';

    if (theme === 'custom') {
        applyCustomTheme(customThemeColor);
        document.documentElement.classList.add(`theme-custom`); 
    } else {
        document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme, customThemeColor]);

  const handleThemeChange = (newTheme: Theme) => {
    console.log('[App] Theme change requested:', newTheme);
    setTheme(newTheme);
    // Don't send password when only changing theme - use undefined to skip password update
    api.setSettings(newTheme, customThemeColor, username, undefined as any).catch(console.error);
  };

  const handleCustomThemeChange = (color: string) => {
    console.log('[App] Custom theme color change requested:', color);
    setTheme('custom');
    setCustomThemeColor(color);
    // Don't send password when only changing color - use undefined to skip password update
    api.setSettings('custom', color, username, undefined as any).catch(console.error);
  };

  const handleUsernameChange = (newUsername: string) => {
    console.log('[App] Username change requested:', newUsername);
    setUsername(newUsername);
    // Don't send password when only changing username - use undefined to skip password update
    api.setSettings(theme, customThemeColor, newUsername, undefined as any).catch(console.error);
  };

  const handlePasswordChange = (newPassword: string) => {
    console.log('[App] Password change requested (length):', newPassword.length);
    setPassword(newPassword);
    // Only send password when explicitly changing it
    api.setSettings(theme, customThemeColor, username, newPassword).catch(console.error);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.log('[App] Starting bootstrap process...');
        const settings = await api.getSettings();
        console.log('[App] Settings received from API:', {
          theme: settings.theme,
          customThemeColor: settings.customThemeColor,
          username: settings.username,
          hasPassword: !!settings.password,
          passwordLength: settings.password ? settings.password.length : 0
        });
        setTheme((['dark-blue','light','dark','custom'] as Theme[]).includes(settings.theme as Theme) ? settings.theme as Theme : 'dark-blue');
        setCustomThemeColor(settings.customThemeColor || '#5e258a');
        setUsername(settings.username || 'Mr and Mrs Pathania');
        setPassword(settings.password || '');
        console.log('[App] Settings loaded successfully');
      } catch (e) {
        console.error('[App] Failed to load settings:', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const loadAppData = async () => {
        try {
          console.log('[App] Loading application data after authentication...');
          await api.generateDueRecurringTransactions();
          await loadData();
          await loadTasks();
          await loadShoppingItems();
          await loadCalendarForWeek();
          console.log('[App] Application data loaded successfully');
        } catch (e) {
          console.error('[App] Failed to load application data:', e);
        }
      };
      loadAppData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    const [transactionsData, budgetsData, categoriesData, savingsData, logsData, recurringData, labelsData] = await Promise.all([
      api.getTransactions(),
      api.getBudgets(),
      api.getCategories(),
      api.getSavings(),
      api.getActivityLog(),
      api.getRecurringTransactions(),
      api.getLabels(),
    ]);

    const overall = budgetsData.find(b => b.category === api.OVERALL_BUDGET_CATEGORY) || null;
    const categoryBudgetsData = budgetsData.filter(b => b.category !== api.OVERALL_BUDGET_CATEGORY);

    setTransactions(transactionsData);
    setOverallBudget(overall);
    setCategoryBudgets(categoryBudgetsData);
    setCategories(categoriesData);
    setSavings(savingsData);
    setActivityLogs(logsData);
    setRecurringTransactions(recurringData);
    setAvailableLabels(labelsData);
  };

  const loadTasks = async () => {
    try {
      const list = await api.getTasks();
      setTasks(list);
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const loadShoppingItems = async () => {
    try {
      const items = await api.getShoppingItems();
      setShoppingItems(items);
    } catch (e) {
      console.error('Failed to load shopping items', e);
    }
  };

  const loadCalendarForWeek = async () => {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    try {
      const events = await api.listCalendarEvents(start.toISOString(), end.toISOString());
      let tasks: any[] = [];
      try {
        tasks = await api.listGoogleTasks();
      } catch (taskError) {
        console.log('Google Tasks not available - please reconnect your Google account');
      }
      const mappedTasks = tasks.map((t: any) => ({
        id: `gtask-${t.id}`,
        gtaskId: t.id,
        title: t.title,
        start: t.due,
        end: t.due,
        allDay: true,
        status: t.status,
        isGtask: true,
      }));
      setCalendarEvents([...events, ...mappedTasks]);
    } catch (e) {
      // not connected yet
      setCalendarEvents([]);
    }
  };

  const handleCalendarDatesChange = async (start: Date, end: Date) => {
    try {
      const events = await api.listCalendarEvents(start.toISOString(), end.toISOString());
      let tasks: any[] = [];
      try {
        tasks = await api.listGoogleTasks();
      } catch (taskError) {
        console.log('Google Tasks not available yet - please reconnect your Google account to enable Tasks integration');
      }
      const mappedTasks = tasks.map((t: any) => ({
        id: `gtask-${t.id}`,
        gtaskId: t.id,
        title: t.title,
        start: t.due,
        end: t.due,
        allDay: true,
        status: t.status,
        isGtask: true,
        gcalEventId: null,
      }));
      setCalendarEvents([...events, ...mappedTasks]);
    } catch (e) {
      // not connected yet
      setCalendarEvents([]);
    }
  };
  
  const handleSaveTransaction = async (data: TransactionFormData) => {
    if (data.isRecurring) {
        const recurringTx: Omit<RecurringTransaction, 'id'> = {
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            startDate: data.date,
            frequency: 'monthly',
            dayOfMonth: new Date(data.date).getUTCDate(),
            labels: data.labels,
        };
        await api.addRecurringTransaction(recurringTx);
        await api.generateDueRecurringTransactions();
    } else {
        const singleTx: Omit<Transaction, 'id'> = {
            description: data.description,
            amount: data.amount,
            quantity: data.quantity,
            type: data.type,
            category: data.category,
            date: data.date,
            labels: data.labels,
        };
        await api.addTransaction(singleTx);
    }
    
    await loadData();
    setCurrentPage('dashboard');
  };

  const handleScanReceipt = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        console.log('[ReceiptScan] File loaded:', { name: file.name, size: file.size, type: file.type });
        const base64Image = (reader.result as string).split(',')[1];
        const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE).map(c => c.name);

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string) || (process.env.API_KEY as string);
        console.log('[ReceiptScan] API key present:', !!apiKey, 'length:', apiKey ? apiKey.length : 0);

        if (!apiKey) {
          console.error('[ReceiptScan] Missing Gemini API key. Environment variables:', {
            VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
            processEnv: {
              GEMINI_API_KEY: process.env.GEMINI_API_KEY,
              API_KEY: process.env.API_KEY,
            }
          });
          alert('Gemini API key missing. Please configure VITE_GEMINI_API_KEY before using receipt scan.');
          reject(new Error('Missing Gemini API key'));
          return;
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
              parts: [
                { text: `You are an expert receipt scanner. The receipt may be in German. Analyze this receipt image. If the text is in German, translate all item descriptions to English. Extract every line item as a separate transaction. For each item, provide a concise 'description' (in English), the total 'amount' as a number, the 'quantity' of the item as a number (default to 1 if not specified), and the 'date' of the transaction from the receipt in YYYY-MM-DD format. If the date is not found, use today's date: ${new Date().toISOString().split('T')[0]}. Also, suggest a 'category' for each item from the following list of available categories: ${expenseCategories.join(', ')}. Finally, suggest up to two relevant 'labels' as an array of strings. Respond ONLY with a valid JSON array matching the provided schema. Do not include any other text or explanations.` },
                { inlineData: { mimeType: file.type, data: base64Image } }
              ]
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    quantity: { type: Type.NUMBER },
                    date: { type: Type.STRING },
                    category: { type: Type.STRING },
                    labels: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['description', 'amount', 'date', 'category', 'labels', 'quantity']
                }
              }
            }
          });

          console.log('[ReceiptScan] Raw AI response length:', response.text?.length || 0);

          const parsedItems: TransactionFormData[] = JSON.parse(response.text).map((item: any) => ({
            ...item,
            quantity: item.quantity || 1,
            type: TransactionType.EXPENSE,
            isRecurring: false,
            category: expenseCategories.includes(item.category) ? item.category : expenseCategories[0] || 'Other'
          }));
          console.log('[ReceiptScan] Parsed items count:', parsedItems.length);
          setReceiptItemsToConfirm(parsedItems);
          setCurrentPage('confirmReceipt');
          resolve();
        } catch (error) {
          console.error('[ReceiptScan] AI Receipt Scan Failed:', error);
          alert('Error reading the receipt. Please check image quality or try again.');
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error('[ReceiptScan] FileReader error:', error);
        alert('Error reading file. Please try again.');
        reject(error);
      };
    });
  };
    
  const handleSaveAllTransactions = async (items: TransactionFormData[]) => {
      try {
          const transactionsToSave = items.map(item => ({
             description: item.description,
             amount: item.amount,
             quantity: item.quantity,
             date: item.date,
             type: item.type,
             category: item.category,
             labels: item.labels,
          }));
          await api.addMultipleTransactions(transactionsToSave);
          await loadData();
          setReceiptItemsToConfirm([]);
          setCurrentPage('dashboard');
      } catch (error) {
          console.error("Failed to save all transactions:", error);
          alert("There was an error saving the transactions. Please try again.");
      }
  };

  const wrapAction = <T extends any[]>(action: (...args: T) => Promise<any>) => {
    return async (...args: T) => {
      await action(...args);
      await loadData();
    };
  };

  const handleAddCategoryBudget = wrapAction(api.addCategoryBudget);
  const handleEditCategoryBudget = wrapAction(api.updateCategoryBudget);
  const handleSetOverallBudget = wrapAction(api.addOrUpdateOverallBudget);
  const handleSetSaving = wrapAction(api.addOrUpdateSaving);
  const handleAddCategory = wrapAction(api.addCategory);
  const handleUpdateCategory = wrapAction(api.updateCategory);
  const handleDeleteCategory = wrapAction(api.deleteCategory);
  const handleUpdateTransaction = wrapAction(api.updateTransaction);
  
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
        await api.deleteTransaction(transactionId);
        await loadData();
    } catch (error) {
        console.error("Failed to delete transaction:", error);
        alert("Could not delete the transaction. Please try again.");
    }
  };


  const handleEditTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleAddTransactionClick = (type: TransactionType) => {
    setInitialTransactionType(type);
    setCurrentPage('addTransaction');
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
  };

  const navigatePlanner = (page: PlannerPage | Page) => {
    if (page === 'settings') {
      setSection('budget');
      setCurrentPage('settings');
    } else {
      setPlannerPage(page as PlannerPage);
    }
  };

  const handleSectionChange = (s: 'budget' | 'planner') => {
    setSection(s);
    if (s === 'budget') {
      setCurrentPage('dashboard');
    } else {
      setPlannerPage('dashboard');
    }
  };

  const openNewTaskModal = () => {
    setPrefillTask(null);
    setIsTaskModalOpen(true);
  };

  const openNewTaskModalWithSlot = (start: string, end: string) => {
    setPrefillTask({ start, end });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (payload: any, id?: string) => {
    if (id) {
      await api.updateTask(id, payload);
    } else {
      await api.addTask(payload);
    }
    await loadTasks();
    await loadCalendarForWeek();
    setPrefillTask(null); // Clear the prefill data after saving
  };

  const handleUpdateTask = async (id: string, patch: any) => {
    console.log('[App] handleUpdateTask called:', { id, patch });
    if (patch.status === 'in_progress') {
      const task = tasks.find(t => t.id === id);
      if (task && task.progress === null) {
        patch.progress = 0;
      }
    }
    await api.updateTask(id, patch);
    await loadTasks();
    await loadCalendarForWeek();
    console.log('[App] handleUpdateTask completed');
  };

  const handleToggleEvent = async (event: any) => {
    try {
      if (event.isGtask) {
        await api.toggleGoogleTask(event.gtaskId, event.status);
      } else {
        await api.toggleCalendarEvent(event.id, event.status || 'confirmed');
      }
      await loadCalendarForWeek();
    } catch (err) {
      console.error('Failed to toggle event', err);
    }
  };

  const handleEditTask = (task: Task) => {
    setPrefillTask({
      title: task.title,
      notes: task.notes,
      priority: task.priority,
      allDay: task.allDay,
      start: task.start,
      end: task.end,
      due: task.due,
      repeat: task.repeat,
      color: task.color,
      labels: task.labels,
      subtasks: task.subtasks,
      id: task.id
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      await loadTasks();
      await loadCalendarForWeek();
    } catch (err) {
      console.error('Failed to delete task', err);
      alert('Failed to delete task');
    }
  };

  const handleProgressChange = async (taskId: string, progress: number) => {
    console.log('[App] Updating task progress:', taskId, 'to:', progress);
    try {
      await api.updateTask(taskId, { progress });
      await loadTasks();
      console.log('[App] Task progress updated successfully');
    } catch (err) {
      console.error('[App] Failed to update task progress:', err);
      alert('Failed to update task progress');
    }
  };

  // Shopping Item Handlers
  const handleAddShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => {
    try {
      await api.addShoppingItem(item);
      await loadShoppingItems();
    } catch (err) {
      console.error('Failed to add shopping item', err);
      alert('Failed to add shopping item');
    }
  };

  const handleUpdateShoppingItem = async (id: string, patch: Partial<ShoppingItem>) => {
    try {
      await api.updateShoppingItem(id, patch);
      await loadShoppingItems();
    } catch (err) {
      console.error('Failed to update shopping item', err);
      alert('Failed to update shopping item');
    }
  };

  const handleToggleShoppingItem = async (id: string) => {
    const item = shoppingItems.find(item => item.id === id);
    if (!item) return;
    
    const updateData: Partial<ShoppingItem> = {
      completed: !item.completed,
      completedAt: !item.completed ? new Date().toISOString() : null
    };
    
    await handleUpdateShoppingItem(id, updateData);
  };

  const handleEditShoppingItem = (item: ShoppingItem) => {
    setEditingShoppingItem(item);
    setIsShoppingModalOpen(true);
  };

  const handleDeleteShoppingItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.deleteShoppingItem(itemId);
      await loadShoppingItems();
    } catch (err) {
      console.error('Failed to delete shopping item', err);
      alert('Failed to delete shopping item');
    }
  };

  const openNewShoppingModal = () => {
    setEditingShoppingItem(null);
    setIsShoppingModalOpen(true);
  };

  const handleSaveShoppingItem = async (itemData: Omit<ShoppingItem, 'id' | 'createdAt'>) => {
    if (editingShoppingItem) {
      await handleUpdateShoppingItem(editingShoppingItem.id, itemData);
    } else {
      await handleAddShoppingItem(itemData);
    }
    setIsShoppingModalOpen(false);
    setEditingShoppingItem(null);
  };

  const handleLoginSuccess = (loggedInUsername: string) => {
    console.log('[App] Login successful for user:', loggedInUsername);
    setUsername(loggedInUsername);
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen font-sans bg-transparent text-text-primary flex items-center justify-center">
        <p className="text-xl animate-pulse">Loading your budget dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[App] User not authenticated, showing login page');
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  
  console.log('[App] User authenticated, rendering main app');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard
            transactions={transactions}
            onNavigate={navigate}
            overallBudget={overallBudget}
            onEditTransaction={handleEditTransactionClick}
            onDeleteTransaction={handleDeleteTransaction}
            username={username}
        />;
      case 'addTransaction':
        return <AddTransaction onCancel={() => navigate('dashboard')} initialType={initialTransactionType} onSave={handleSaveTransaction} categories={categories} onScanReceipt={handleScanReceipt} availableLabels={availableLabels} />;
      case 'budgets':
        return <Budgets overallBudget={overallBudget} categoryBudgets={categoryBudgets} transactions={transactions} onSetOverallBudget={handleSetOverallBudget} onAddCategoryBudget={handleAddCategoryBudget} onEditCategoryBudget={handleEditCategoryBudget} categories={categories} savings={savings} onSetSaving={handleSetSaving} />;
      case 'transactions':
        return <TransactionsPage transactions={transactions} recurringTransactions={recurringTransactions} categories={categories} onAddTransactionClick={handleAddTransactionClick} onEditTransaction={handleEditTransactionClick} onDeleteTransaction={handleDeleteTransaction} />;
      case 'categories':
        return <CategoriesPage categories={categories} transactions={transactions} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />;
      case 'reports':
        return <ReportsPage transactions={transactions} savings={savings} />;
      case 'confirmReceipt':
        return <ReceiptConfirmationPage items={receiptItemsToConfirm} onSaveAll={handleSaveAllTransactions} onCancel={() => setCurrentPage('addTransaction')} categories={categories.filter(c => c.type === TransactionType.EXPENSE)} availableLabels={availableLabels} />;
      case 'settings':
        return <SettingsPage
            activityLogs={activityLogs}
        />;
      default:
        return <Dashboard
            transactions={transactions}
            onNavigate={navigate}
            overallBudget={overallBudget}
            onEditTransaction={handleEditTransactionClick}
            onDeleteTransaction={handleDeleteTransaction}
            username={username}
        />;
    }
  }

  return (
    <div className="min-h-screen font-sans text-text-primary bg-transparent">
      <TopSwitcher
        section={section}
        onChange={handleSectionChange}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        customThemeColor={customThemeColor}
        onCustomColorChange={handleCustomThemeChange}
        username={username}
        onUsernameChange={handleUsernameChange}
        password={password}
        onPasswordChange={handlePasswordChange}
      />
      {section === 'budget' ? (
        <>
          <Header 
            onNavigate={navigate} 
            currentPage={currentPage} 
            onAddTransactionClick={handleAddTransactionClick}
          />
          <main>
            {renderPage()}
          </main>
          {editingTransaction && (
            <EditTransactionModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                onSave={async (updatedTx) => {
                    await handleUpdateTransaction(updatedTx);
                    setEditingTransaction(null);
                }}
                transaction={editingTransaction}
                categories={categories}
                availableLabels={availableLabels}
            />
          )}
        </>
      ) : (
        <>
          <PlannerHeader page={plannerPage} onNavigate={navigatePlanner} onNewTask={openNewTaskModal} />
          <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {plannerPage === 'dashboard' && (
              <PlannerDashboard
                tasks={tasks}
                events={calendarEvents}
                onRefresh={() => { loadTasks(); loadCalendarForWeek(); }}
                onToggleComplete={(t)=> handleUpdateTask(t.id, { status: t.status === 'completed' ? 'new' : 'completed' })}
                onToggleEvent={handleToggleEvent}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                username={username}
              />
            )}
            {plannerPage === 'progress' && (
              <PlannerBoard
                tasks={tasks}
                onMove={(id, status)=> handleUpdateTask(id, { status })}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onProgressChange={handleProgressChange}
              />
            )}
            {plannerPage === 'calendar' && (
              <PlannerCalendar
                tasks={tasks}
                externalEvents={calendarEvents}
                onCreateSlot={openNewTaskModalWithSlot}
                onDatesChange={handleCalendarDatesChange}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
            {plannerPage === 'backlog' && (
              <PlannerBacklog
                tasks={tasks}
                onPlanToday={(id)=> handleUpdateTask(id, { due: new Date().toISOString().split('T')[0] })}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            )}
            {plannerPage === 'toBuy' && (
              <PlannerToBuy
                items={shoppingItems}
                onAddItem={handleAddShoppingItem}
                onToggleComplete={handleToggleShoppingItem}
                onEdit={handleEditShoppingItem}
                onDelete={handleDeleteShoppingItem}
              />
            )}
          </main>
          <TaskModal
            isOpen={isTaskModalOpen}
            initial={prefillTask || undefined}
            onClose={()=> {
              setIsTaskModalOpen(false);
              setPrefillTask(null); // Clear prefill data when modal closes
            }}
            onSave={handleSaveTask}
          />
          <ShoppingItemModal
            isOpen={isShoppingModalOpen}
            onClose={() => {
              setIsShoppingModalOpen(false);
              setEditingShoppingItem(null);
            }}
            onSave={handleSaveShoppingItem}
            initialItem={editingShoppingItem || undefined}
          />
        </>
      )}
    </div>
  );
};

export default App;