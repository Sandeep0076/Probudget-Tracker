# ProBudget Tracker - Technical Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Folder Structure](#folder-structure)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Structure](#api-structure)
7. [Frontend Architecture](#frontend-architecture)
8. [Backend Architecture](#backend-architecture)
9. [Key Design Patterns](#key-design-patterns)
10. [External Integrations](#external-integrations)

---

## System Overview

ProBudget Tracker is a full-stack monorepo application following a client-server architecture with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   React UI  │  │  State Mgmt  │  │  API Service     │  │
│  │  Components │  │  (useState)  │  │  Layer (api.ts)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Express.js │  │  Middleware  │  │  Route Handlers  │  │
│  │  REST API   │  │  (CORS, etc) │  │  (Controllers)   │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ Supabase Client
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Supabase PostgreSQL Database                 │  │
│  │  (transactions, budgets, categories, tasks, users)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Google      │  │  Google      │  │  Google Gemini  │  │
│  │  Calendar    │  │  Tasks       │  │  AI (Receipt)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, Supabase Client |
| **Database** | PostgreSQL (via Supabase) |
| **Build Tools** | Vite, TypeScript Compiler, PostCSS |
| **UI Libraries** | FullCalendar, Recharts, @dnd-kit |
| **AI/ML** | Google Gemini API |
| **External APIs** | Google Calendar, Google Tasks |

---

## Architecture Patterns

### 1. Monorepo Structure
- Frontend and backend in single repository
- Shared TypeScript types between client/server
- Unified dependency management

### 2. REST API Design
- Resource-based endpoints (`/api/transactions`, `/api/budgets`)
- HTTP methods for CRUD operations (GET, POST, PUT, DELETE)
- JSON request/response format
- Consistent error handling

### 3. Service Layer Pattern
- Frontend: `services/api.ts` - centralized API calls
- Backend: Route handlers delegate to service functions
- Clean separation of concerns

### 4. Repository Pattern
- Supabase client acts as data access layer
- Abstract database operations behind API endpoints
- No direct database access from frontend

### 5. Component-Based Architecture
- React functional components with hooks
- Composition over inheritance
- Single Responsibility Principle per component

---

## Folder Structure

### Root Level

```
probudget-tracker/
├── components/          # React UI components (frontend)
├── server/              # Express backend server
├── services/            # Frontend API client layer
├── utils/               # Shared utility functions
├── types.ts             # TypeScript type definitions
├── App.tsx              # Root React component
├── index.tsx            # React entry point
├── index.html           # HTML template
├── index.css            # Global styles & theme CSS
├── vite.config.ts       # Vite build configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies & scripts
└── README.md            # Project documentation
```

### Components Directory

```
components/
├── icons/               # SVG icon components
│   ├── ActionIcons.tsx  # Edit, Delete icons
│   ├── CategoryIcons.tsx # Budget category icons
│   ├── PlusIcon.tsx     # Add action icons
│   └── ...              # Other icon components
│
├── planner/             # Task planner components
│   ├── PlannerDashboard.tsx  # Todo list view
│   ├── PlannerBoard.tsx      # Kanban board
│   ├── PlannerCalendar.tsx   # Calendar view
│   ├── PlannerToBuy.tsx      # Shopping list
│   ├── TaskModal.tsx         # Task create/edit modal
│   └── ...                   # Other planner components
│
├── reports/             # Analytics & reporting
│   ├── InteractiveReportDashboard.tsx
│   └── charts/          # Chart components
│       ├── SpendingPieChart.tsx
│       ├── TimeSeriesLineChart.tsx
│       └── ...
│
├── Dashboard.tsx        # Main dashboard page
├── Budgets.tsx          # Budget management page
├── TransactionsPage.tsx # Transaction list page
├── CategoriesPage.tsx   # Category management
├── ReportsPage.tsx      # Analytics page
├── SettingsPage.tsx     # Settings & preferences
├── LoginPage.tsx        # Authentication page
├── Header.tsx           # Navigation header
├── AddTransaction.tsx   # Transaction entry form
├── ReceiptConfirmationPage.tsx # Receipt review
└── ...                  # Other UI components
```

### Server Directory

```
server/
├── migrations/          # Database migration scripts
│   ├── add-security-question.sql
│   ├── add-task-progress.sql
│   ├── add-shopping-items.sql
│   └── README.md        # Migration documentation
│
├── index.js             # Main Express server
├── supabaseClient.js    # Database connection setup
└── ...                  # Utility scripts
```

### Services Directory

```
services/
└── api.ts               # Centralized API client
    ├── Transaction APIs  # CRUD for transactions
    ├── Budget APIs       # Budget management
    ├── Category APIs     # Category operations
    ├── Task APIs         # Planner operations
    ├── Auth APIs         # Authentication
    └── Admin APIs        # Migration & maintenance
```

---

## Data Flow

### Transaction Creation Flow

```
User Input (AddTransaction.tsx)
    ↓
Form Submission
    ↓
api.addTransaction(data) [services/api.ts]
    ↓
POST /api/transactions [HTTP Request]
    ↓
Express Route Handler [server/index.js]
    ↓
Validate & Transform Data
    ↓
supabase.from('transactions').insert() [Database Insert]
    ↓
Insert Labels (if any) [transaction_labels table]
    ↓
Log Activity [activity_log table]
    ↓
Response with Transaction ID
    ↓
Frontend Reloads Data
    ↓
UI Updates [Dashboard, TransactionsPage]
```

### Receipt Scanning Flow

```
User Uploads Image (AddTransaction.tsx)
    ↓
handleScanReceipt(file) [App.tsx]
    ↓
Read File as Base64
    ↓
Google Gemini API Request
    - Include expense categories
    - Specify JSON schema
    - Request item extraction
    ↓
AI Response Processing
    - Parse JSON items
    - Validate categories
    - Set default quantity=1
    ↓
Navigate to ReceiptConfirmationPage
    - Display all items
    - Allow editing
    - Enable bulk save
    ↓
handleSaveAllTransactions() [App.tsx]
    ↓
api.addMultipleTransactions(items)
    ↓
POST /api/transactions/bulk
    ↓
Bulk Insert Transactions
    ↓
Process Labels in Parallel
    ↓
Dashboard Updates
```

### Recurring Transaction Generation Flow

```
App Bootstrap / Manual Trigger
    ↓
api.generateDueRecurringTransactions()
    ↓
POST /api/recurring/generate-due
    ↓
Fetch All Recurring Transactions
    ↓
For each recurring transaction:
    - Check last generated date
    - Calculate due dates up to today
    - Skip if already generated
    ↓
Bulk Insert Due Transactions
    - Link to recurring_transaction_id
    - Copy description, amount, category
    - Set generated date
    ↓
Insert Associated Labels
    ↓
Return count of generated transactions
```

### Task Update Flow (with Progress)

```
User Updates Task (PlannerBoard.tsx)
    ↓
handleProgressChange(taskId, progress)
    ↓
api.updateTask(taskId, { progress })
    ↓
PUT /api/tasks/:id
    ↓
Validate Progress Value (0-100)
    ↓
Update Task in Database
    - Set progress column
    - Update updated_at timestamp
    - Set completed_at if status='completed'
    ↓
Handle Migration Fallback (if column missing)
    ↓
Update Labels & Subtasks
    ↓
Response Confirmation
    ↓
Frontend Reloads Tasks
    ↓
UI Updates Progress Bar
```

---

## Database Schema

### Core Tables

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,           -- Stored in cents (EUR * 100)
  date DATE NOT NULL,                -- DATE format (YYYY-MM-DD)
  type TEXT NOT NULL,                -- 'INCOME' or 'EXPENSE'
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_recurring ON transactions(recurring_transaction_id);
```

#### budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,            -- '##OVERALL_BUDGET##' for overall
  amount INTEGER NOT NULL,           -- Stored in cents
  month INTEGER NOT NULL,            -- 0-11 (Jan-Dec)
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, month, year)
);

-- Indexes
CREATE INDEX idx_budgets_month_year ON budgets(month, year);
CREATE INDEX idx_budgets_category ON budgets(category);
```

#### categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                -- 'INCOME' or 'EXPENSE'
  is_default BOOLEAN DEFAULT FALSE,
  affects_budget BOOLEAN DEFAULT TRUE, -- Whether to include in budget calc
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_type ON categories(type);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'new',         -- 'new', 'scheduled', 'in_progress', 'completed', 'backlog'
  priority TEXT DEFAULT 'medium',    -- 'low', 'medium', 'high'
  all_day BOOLEAN DEFAULT FALSE,
  start DATE,                        -- DATE format
  end DATE,                          -- DATE format
  due DATE,                          -- DATE format
  repeat_json JSONB,                 -- Recurrence rules
  color TEXT,
  gcal_event_id TEXT,                -- Google Calendar event ID
  gtask_id TEXT,                     -- Google Tasks ID
  progress INTEGER DEFAULT 0,        -- 0-100 percentage
  estimated_time TEXT,               -- e.g., "2 hours", "5 days"
  task_type TEXT DEFAULT 'todo',     -- 'todo' or 'schedule'
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE,
  completed_at DATE,                 -- Set when status='completed'
  deleted_at DATE                    -- Soft delete timestamp
);

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at);
CREATE INDEX idx_tasks_completed ON tasks(completed_at);
CREATE INDEX idx_tasks_due ON tasks(due);
```

#### labels
```sql
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,         -- Always capitalized
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### transaction_labels (Junction Table)
```sql
CREATE TABLE transaction_labels (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, label_id)
);

-- Indexes
CREATE INDEX idx_transaction_labels_txn ON transaction_labels(transaction_id);
CREATE INDEX idx_transaction_labels_label ON transaction_labels(label_id);
```

#### recurring_transactions
```sql
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,           -- Stored in cents
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date DATE NOT NULL,
  frequency TEXT DEFAULT 'monthly',   -- Currently only 'monthly' supported
  day_of_month INTEGER NOT NULL,     -- 1-31
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,            -- Plain text (TODO: hash in production)
  security_question TEXT,
  security_answer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### settings (Key-Value Store)
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stored settings:
-- 'theme', 'customThemeColor', 'gcal_tokens' (encrypted)
```

#### activity_log
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  action TEXT NOT NULL,              -- 'CREATE', 'UPDATE', 'DELETE'
  description TEXT NOT NULL
);

-- Index
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
```

### Data Relationships

```
transactions ─┬─ many-to-many ─→ labels (via transaction_labels)
              └─ many-to-one ──→ recurring_transactions

budgets ──────── one-to-one ───→ categories (by name)

tasks ───────┬─ many-to-many ─→ labels (via task_labels)
             └─ one-to-many ──→ subtasks

categories ──── referenced by ─→ transactions, budgets

users ───────── referenced by ─→ (future: transactions ownership)
```

---

## API Structure

### REST API Endpoints

#### Transactions
```
GET    /api/transactions              # List all transactions
POST   /api/transactions              # Create single transaction
PUT    /api/transactions/:id          # Update transaction
DELETE /api/transactions/:id          # Delete transaction
POST   /api/transactions/bulk         # Create multiple transactions
```

#### Budgets
```
GET    /api/budgets                   # List all budgets
POST   /api/budgets/category          # Create category budget
PUT    /api/budgets/:id               # Update budget amount
POST   /api/budgets/overall           # Set overall budget (upsert)
```

#### Categories
```
GET    /api/categories                # List all categories
POST   /api/categories                # Create category
PUT    /api/categories/:id            # Update category
DELETE /api/categories/:id            # Delete category
```

#### Recurring Transactions
```
GET    /api/recurring                 # List recurring transactions
POST   /api/recurring                 # Create recurring transaction
PUT    /api/recurring/:id             # Update recurring transaction
DELETE /api/recurring/:id             # Delete recurring transaction
POST   /api/recurring/generate-due    # Generate due transactions
```

#### Tasks (Planner)
```
GET    /api/tasks                     # List all active tasks
POST   /api/tasks                     # Create task
PUT    /api/tasks/:id                 # Update task
DELETE /api/tasks/:id                 # Soft delete (move to trash)

GET    /api/tasks/trash               # List trashed tasks
POST   /api/tasks/:id/restore         # Restore from trash
DELETE /api/tasks/:id/permanent       # Permanently delete
POST   /api/tasks/purge-old           # Purge old trashed tasks
POST   /api/tasks/purge-completed     # Purge old completed tasks
```

#### Shopping Items
```
GET    /api/shopping-items            # List shopping items
POST   /api/shopping-items            # Create shopping item
PUT    /api/shopping-items/:id        # Update shopping item
DELETE /api/shopping-items/:id        # Delete shopping item
```

#### Labels
```
GET    /api/labels                    # List all unique labels
```

#### Savings
```
GET    /api/savings                   # List savings entries
POST   /api/savings/upsert            # Create/update savings
```

#### Activity Log
```
GET    /api/activity                  # List recent activities
```

#### Authentication
```
POST   /api/auth/login                # User login
POST   /api/auth/verify-security-question  # Verify for password reset
POST   /api/auth/reset-password       # Reset password
```

#### Settings
```
GET    /api/settings                  # Get user settings
POST   /api/settings                  # Update settings
```

#### Google Calendar Integration
```
GET    /api/calendar/auth-url         # Get OAuth URL
GET    /api/calendar/callback         # OAuth callback handler
GET    /api/calendar/status           # Connection status
GET    /api/calendar/events           # List calendar events
POST   /api/calendar/events           # Create event
PUT    /api/calendar/events/:id       # Update event
DELETE /api/calendar/events/:id       # Delete event
GET    /api/calendar/disconnect       # Disconnect account
POST   /api/sync-google               # Import Google data
```

#### Admin
```
POST   /api/admin/run-migration       # Run database migrations
```

### API Response Patterns

#### Success Response
```typescript
// Single Resource
{
  id: "uuid",
  ...resourceFields
}

// List Response
[
  { id: "uuid", ...fields },
  { id: "uuid", ...fields }
]

// Operation Success
{ ok: true }

// With Metadata
{ 
  ok: true, 
  created: 5,
  errors: [] 
}
```

#### Error Response
```typescript
{
  error: "Human-readable error message",
  details: "Additional context (optional)",
  code: "ERROR_CODE (optional)"
}
```

### API Client Layer (Frontend)

Located in `services/api.ts`, provides typed wrapper functions:

```typescript
// Example structure
export const getTransactions = () => 
  get<Transaction[]>('/api/transactions');

export const addTransaction = (tx: Omit<Transaction, 'id'>) => 
  post<Transaction>('/api/transactions', tx);

export const updateTask = (id: string, task: Partial<Task>) => 
  put<{ ok: boolean }>(`/api/tasks/${id}`, task);
```

**Benefits:**
- Type safety with TypeScript
- Centralized error handling
- Consistent request formatting
- Easy to mock for testing

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx (Root)
├── LoginPage.tsx (if not authenticated)
└── Authenticated App
    ├── TopSwitcher (Budget/Planner toggle + Settings)
    │
    ├── Budget Section
    │   ├── Header (Navigation)
    │   ├── Dashboard
    │   │   ├── BudgetSummaryCard
    │   │   ├── ExpenseChart
    │   │   └── RecentTransactions
    │   ├── AddTransaction
    │   │   └── ReceiptConfirmationPage (after scan)
    │   ├── Budgets
    │   │   ├── OverallBudgetCard
    │   │   └── BudgetCard (multiple)
    │   ├── TransactionsPage
    │   │   ├── TransactionListItem (multiple)
    │   │   └── RecurringTransactionListItem (multiple)
    │   ├── CategoriesPage
    │   │   └── CategoryModal
    │   ├── ReportsPage
    │   │   └── InteractiveReportDashboard
    │   │       └── Various Chart Components
    │   └── SettingsPage
    │
    └── Planner Section
        ├── PlannerHeader (Navigation + Sync)
        ├── PlannerDashboard (Todo view)
        ├── PlannerBoard (Kanban view)
        ├── PlannerCalendar (Calendar view)
        ├── PlannerToBuy (Shopping list)
        ├── TrashboxPage (Deleted tasks)
        ├── TaskModal (Create/Edit)
        └── ShoppingItemModal (Create/Edit)
```

### State Management

**Approach:** React `useState` hooks in `App.tsx` (Prop Drilling)

**Main State Variables:**

```typescript
// App-level state in App.tsx
const [section, setSection] = useState<'budget' | 'planner'>('budget');
const [currentPage, setCurrentPage] = useState<Page>('dashboard');
const [plannerPage, setPlannerPage] = useState<PlannerPage>('todo');

// Data state
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [categoryBudgets, setCategoryBudgets] = useState<Budget[]>([]);
const [overallBudget, setOverallBudget] = useState<Budget | null>(null);
const [categories, setCategories] = useState<Category[]>([]);
const [savings, setSavings] = useState<Saving[]>([]);
const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);
const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

// UI state
const [theme, setTheme] = useState<Theme>('dark-blue');
const [customThemeColor, setCustomThemeColor] = useState<string>('#5e258a');
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [username, setUsername] = useState<string>('Mr and Mrs Pathania');
```

**Why not Redux/Context?**
- Single-page app with manageable state complexity
- Parent-child component relationships are clear
- Fast development without boilerplate
- Easy to understand data flow

### React Patterns Used

#### 1. Component Composition
```typescript
// Parent passes data and callbacks
<Dashboard
  transactions={transactions}
  onNavigate={navigate}
  onEditTransaction={handleEditTransactionClick}
/>
```

#### 2. Controlled Components
```typescript
// Form inputs controlled by state
<input
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

#### 3. Conditional Rendering
```typescript
// Render different pages based on state
{currentPage === 'dashboard' && <Dashboard {...props} />}
{currentPage === 'budgets' && <Budgets {...props} />}
```

#### 4. Custom Hooks (Minimal)
- Primarily uses built-in hooks (`useState`, `useEffect`)
- No custom hooks to keep it simple

#### 5. Wrapper Functions for Side Effects
```typescript
// Wraps API calls with data reload
const wrapAction = <T extends any[]>(action: (...args: T) => Promise<any>) => {
  return async (...args: T) => {
    await action(...args);
    await loadData();  // Reload data after action
  };
};

const handleAddCategoryBudget = wrapAction(api.addCategoryBudget);
```

---

## Backend Architecture

### Server Structure

**File:** `server/index.js`

**Express App Setup:**
```javascript
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Routes (inline in same file)
app.get('/api/transactions', async (req, res) => { ... });
app.post('/api/transactions', async (req, res) => { ... });
// ... more routes

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
```

### Key Backend Patterns

#### 1. Amount Storage (Cents vs Euros)

**Pattern:** Store as INTEGER cents, display as DECIMAL euros

```javascript
// Helper functions
function toEuros(cents) {
  return cents / 100;
}

function toCents(euros) {
  return Math.round(euros * 100);
}

// Usage
app.post('/api/transactions', async (req, res) => {
  const { amount } = req.body;  // Received as euros
  await supabase.from('transactions').insert({ 
    amount: toCents(amount)      // Store as cents
  });
});

app.get('/api/transactions', async (req, res) => {
  const { data } = await supabase.from('transactions').select('*');
  const transactions = data.map(t => ({
    ...t,
    amount: toEuros(t.amount)    // Return as euros
  }));
  res.json(transactions);
});
```

**Why?**
- Avoids floating-point precision errors
- INTEGER storage is faster and more reliable
- Standard practice for financial applications

#### 2. Label Management (Upsert Pattern)

```javascript
async function upsertLabelIdByName(name) {
  // Normalize: capitalize first letter
  const normalized = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  
  // Try to find existing label
  let { data: label } = await supabase
    .from('labels')
    .select('id')
    .eq('name', normalized)
    .single();
  
  // If found, return ID
  if (label) return label.id;
  
  // Otherwise, create new label
  const { data: newLabel } = await supabase
    .from('labels')
    .insert({ name: normalized })
    .select('id')
    .single();
  
  return newLabel.id;
}
```

**Usage in Transaction Creation:**
```javascript
// Get or create label IDs
const labelIds = await Promise.all(
  labels.map(name => upsertLabelIdByName(name))
);

// Create junction table entries
const transactionLabels = labelIds.map(label_id => ({
  transaction_id: transactionId,
  label_id
}));

await supabase.from('transaction_labels').insert(transactionLabels);
```

#### 3. Activity Logging

```javascript
async function addActivity(action, description) {
  await supabase.from('activity_log').insert({ 
    action,        // 'CREATE', 'UPDATE', 'DELETE'
    description    // Human-readable description
  });
}

// Usage
await addActivity('CREATE', `Added transaction: "${description}".`);
await addActivity('UPDATE', `Updated budget for ${category} to $${amount}.`);
```

#### 4. Error Handling Pattern

```javascript
app.post('/api/resource', async (req, res) => {
  try {
    // Validate input
    if (!requiredField) {
      return res.status(400).json({ error: 'Field is required' });
    }
    
    // Perform operation
    const { data, error } = await supabase.from('table').insert(payload);
    
    // Handle database errors
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Operation failed' });
    }
    
    // Success
    res.json(data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### 5. OAuth Token Management

```javascript
async function refreshGoogleTokensIfNeeded(oauth) {
  const expiryDate = oauth.credentials.expiry_date;
  const now = Date.now();
  const secondsLeft = Math.floor((expiryDate - now) / 1000);
  
  // Refresh if expiring within threshold
  const TOKEN_REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes
  
  if (secondsLeft < TOKEN_REFRESH_THRESHOLD_SECONDS) {
    const refreshed = await oauth.refreshAccessToken();
    const newTokens = refreshed.credentials;
    
    // Preserve refresh_token if not returned
    if (!newTokens.refresh_token && oauth.credentials.refresh_token) {
      newTokens.refresh_token = oauth.credentials.refresh_token;
    }
    
    // Store encrypted tokens
    await setSetting('gcal_tokens', encryptJSON(newTokens));
    
    return newTokens;
  }
  
  return oauth.credentials;
}
```

#### 6. Soft Delete Pattern (Tasks)

```javascript
// Soft delete (set deleted_at timestamp)
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.from('tasks').update({
    deleted_at: today,
    updated_at: today
  }).eq('id', id);
  
  res.json({ ok: true, trashedAt: today });
});

// Restore from trash
app.post('/api/tasks/:id/restore', async (req, res) => {
  const { id } = req.params;
  
  await supabase.from('tasks').update({
    deleted_at: null,
    updated_at: new Date().toISOString().split('T')[0]
  }).eq('id', id);
  
  