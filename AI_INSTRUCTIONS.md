# AI Instructions for ProBudget Tracker

This document contains **mandatory rules and constraints** that MUST be followed when modifying or extending the ProBudget Tracker codebase. These rules ensure code consistency, prevent bugs, and maintain the project's architectural integrity.

---

## Table of Contents

1. [Critical Rules - ALWAYS Follow](#critical-rules---always-follow)
2. [Theme System Rules](#theme-system-rules)
3. [Database Patterns](#database-patterns)
4. [API Development Rules](#api-development-rules)
5. [Frontend Component Rules](#frontend-component-rules)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Error Handling](#error-handling)
8. [Logging & Debugging](#logging--debugging)
9. [Security Considerations](#security-considerations)
10. [Things You Should NEVER Do](#things-you-should-never-do)
11. [Deployment Configuration](#deployment-configuration)
12. [Testing & Validation](#testing--validation)

---

## Critical Rules - ALWAYS Follow

### 1. **Theme Changes Must Be Global**
When making ANY color, positioning, or aesthetic change:
- ✅ Identify ALL locations where the theme variable is used
- ✅ Update ALL instances across the entire codebase
- ✅ Check `index.css`, component styles, and Tailwind classes
- ✅ Test all 4 themes (dark-blue, light, dark, custom)
- ❌ NEVER change just one place - this breaks theme consistency

**Example:** If changing button colors:
```typescript
// Must update in ALL these places:
// 1. index.css (global button styles)
// 2. tailwind.config.js (if using Tailwind classes)
// 3. utils/theme.ts (custom theme generator)
// 4. All component button classes
```

### 2. **Always Add Logging for Debugging**
- ✅ Add `console.log` statements for all significant operations
- ✅ Log function entry/exit points
- ✅ Log data transformations
- ✅ Log API requests/responses
- ✅ Use descriptive prefixes: `[ComponentName]`, `[API]`, `[Database]`

**Example:**
```typescript
const handleSaveTransaction = async (data: TransactionFormData) => {
  console.log('[AddTransaction] Saving transaction:', data);
  try {
    const result = await api.addTransaction(data);
    console.log('[AddTransaction] Save successful:', result);
  } catch (error) {
    console.error('[AddTransaction] Save failed:', error);
  }
};
```

### 3. **Reload Data After Mutations**
After ANY create/update/delete operation:
- ✅ Always call `loadData()` or specific reload function
- ✅ Ensure UI reflects the latest state
- ✅ Handle race conditions appropriately

```typescript
const handleDeleteTransaction = async (id: string) => {
  await api.deleteTransaction(id);
  await loadData();  // REQUIRED - reload to update UI
};
```

---

## Theme System Rules

### CSS Variable Usage

**ALWAYS use CSS variables for colors:**
```css
/* ✅ CORRECT */
color: var(--color-text-primary);
background: var(--color-card-bg);
border: 1px solid var(--color-border-highlight);

/* ❌ WRONG - Never hardcode colors */
color: #ffffff;
background: rgba(255, 255, 255, 0.2);
```

### Theme Class Application

Themes are applied via class on `<html>` element:
```typescript
// ✅ CORRECT - Set theme class
document.documentElement.className = 'theme-dark-blue';

// For custom theme, also call applyCustomTheme()
if (theme === 'custom') {
  applyCustomTheme(customThemeColor);
  document.documentElement.classList.add('theme-custom');
}
```

### 3D Design System

All cards and interactive elements MUST follow the 3D pattern:

```tsx
// ✅ CORRECT - Standard card pattern
<div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 
                shadow-neu-3d hover:shadow-card-hover 
                transition-shadow duration-300
                border-t border-l border-b border-r
                border-t-border-highlight border-l-border-highlight
                border-b-border-shadow border-r-border-shadow">
  {/* Content */}
</div>

// ❌ WRONG - Missing 3D elements
<div className="bg-white p-5 shadow-md">
  {/* Content */}
</div>
```

### Shadow Hierarchy

Use the predefined shadow classes:
- `shadow-neu-3d` - Main cards, important containers
- `shadow-neu-lg` - Large modals, overlays
- `shadow-neu-sm` - Buttons, small cards, list items
- `shadow-neu-xs` - Subtle elements, chips, badges
- `shadow-inner` - Inset/pressed elements
- `shadow-card-hover` - Hover states for cards

**Never create custom shadows** - use the system!

---

## Database Patterns

### 1. **Date Format - Always Use DATE Type**

**CRITICAL:** All dates MUST be stored as `DATE` format (YYYY-MM-DD), NOT timestamps.

```javascript
// ✅ CORRECT - DATE format
const today = new Date().toISOString().split('T')[0];  // "2024-01-15"
await supabase.from('tasks').insert({ 
  created_at: today,  // DATE
  due: dueDate        // DATE (YYYY-MM-DD)
});

// ❌ WRONG - Using timestamp/datetime
const today = new Date().toISOString();  // "2024-01-15T10:30:00.000Z"
await supabase.from('tasks').insert({ 
  created_at: today  // WRONG - will cause type errors
});
```

**Why?** 
- Avoids timezone issues
- Consistent with existing schema
- Simpler date comparisons
- Database indexes work better

### 2. **Amount Storage - Always Use Cents (INTEGER)**

**CRITICAL:** Financial amounts MUST be stored as INTEGER cents, displayed as DECIMAL euros.

```javascript
// ✅ CORRECT - Convert to/from cents
function toCents(euros) {
  return Math.round(euros * 100);
}

function toEuros(cents) {
  return cents / 100;
}

// Store
await supabase.from('transactions').insert({
  amount: toCents(25.50)  // Stores 2550
});

// Retrieve
const { data } = await supabase.from('transactions').select('*');
const transactions = data.map(t => ({
  ...t,
  amount: toEuros(t.amount)  // Displays 25.50
}));

// ❌ WRONG - Storing as decimal
await supabase.from('transactions').insert({
  amount: 25.50  // WRONG - floating point precision errors
});
```

### 3. **Label Capitalization**

Labels MUST always have the first letter capitalized:

```javascript
// ✅ CORRECT - Capitalize first letter
async function upsertLabelIdByName(name) {
  const normalized = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  // ... rest of logic
}

// Usage
await upsertLabelIdByName('groceries');  // Stored as "Groceries"
await upsertLabelIdByName('Rent');       // Stored as "Rent"
```

### 4. **Soft Delete Pattern (Tasks)**

Tasks use soft delete with `deleted_at` timestamp:

```javascript
// ✅ CORRECT - Soft delete
await supabase.from('tasks').update({
  deleted_at: new Date().toISOString().split('T')[0],  // DATE format
  updated_at: new Date().toISOString().split('T')[0]
}).eq('id', taskId);

// To restore
await supabase.from('tasks').update({
  deleted_at: null,
  updated_at: new Date().toISOString().split('T')[0]
}).eq('id', taskId);

// Query active tasks only
const { data } = await supabase
  .from('tasks')
  .select('*')
  .is('deleted_at', null);  // Exclude soft-deleted

// ❌ WRONG - Hard delete
await supabase.from('tasks').delete().eq('id', taskId);
```

---

## API Development Rules

### 1. **Consistent Error Handling**

```javascript
// ✅ CORRECT - Proper error handling
app.post('/api/resource', async (req, res) => {
  try {
    // Validate
    if (!req.body.requiredField) {
      return res.status(400).json({ 
        error: 'requiredField is required' 
      });
    }
    
    // Perform operation
    const { data, error } = await supabase.from('table').insert(payload);
    
    if (error) {
      console.error('[API] Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to create resource',
        details: error.message 
      });
    }
    
    // Log success
    console.log('[API] Resource created:', data.id);
    
    // Add activity log
    await addActivity('CREATE', `Created resource: ${data.name}`);
    
    res.json(data);
    
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. **Activity Logging**

Always log user actions in `activity_log` table:

```javascript
// ✅ CORRECT - Log all mutations
await addActivity('CREATE', `Added transaction: "${description}".`);
await addActivity('UPDATE', `Updated budget for ${category} to €${amount}.`);
await addActivity('DELETE', `Deleted category "${name}".`);

// Activity actions: 'CREATE', 'UPDATE', 'DELETE'
```

### 3. **Transaction Label Pattern**

When creating/updating transactions with labels:

```javascript
// ✅ CORRECT - Upsert labels, create junction entries
const labelIds = await Promise.all(
  labels.map(name => upsertLabelIdByName(name))
);

const transactionLabels = labelIds.map(label_id => ({
  transaction_id: transactionId,
  label_id
}));

await supabase.from('transaction_labels').insert(transactionLabels);

// On update, delete old labels first
await supabase.from('transaction_labels').delete().eq('transaction_id', id);
// Then insert new ones
```

### 4. **API Response Format**

```typescript
// ✅ CORRECT - Consistent response format

// Single resource
res.json({ id: "uuid", ...fields });

// List
res.json([{ id: "uuid", ...fields }]);

// Operation success
res.json({ ok: true });

// With metadata
res.json({ ok: true, created: 5, errors: [] });

// Error
res.status(400).json({ 
  error: "Human-readable message",
  details: "Additional context",
  code: "ERROR_CODE" 
});
```

---

## Frontend Component Rules

### 1. **Component File Structure**

```typescript
// ✅ CORRECT - Imports, interface, component, export
import React from 'react';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, onNavigate }) => {
  // Component logic
  
  return (
    // JSX
  );
};

export default Dashboard;
```

### 2. **Props Drilling is OK**

This project uses prop drilling (no Context/Redux):
- ✅ Pass data through props
- ✅ Pass callbacks through props
- ✅ Keep component hierarchy clear
- ❌ Don't introduce Context unless absolutely necessary

### 3. **State Management Pattern**

All main state lives in `App.tsx`:

```typescript
// ✅ CORRECT - State in App.tsx
const [transactions, setTransactions] = useState<Transaction[]>([]);

// Pass to children
<Dashboard 
  transactions={transactions}
  onAddTransaction={handleAddTransaction}
/>

// ❌ WRONG - Duplicating state in children
// Don't create separate useState for same data in child components
```

### 4. **Loading Data Pattern**

```typescript
// ✅ CORRECT - Centralized data loading
const loadData = async () => {
  const [txData, budgetData, catData] = await Promise.all([
    api.getTransactions(),
    api.getBudgets(),
    api.getCategories(),
  ]);
  
  setTransactions(txData);
  setBudgets(budgetData);
  setCategories(catData);
};

// Call on mount
useEffect(() => {
  if (isAuthenticated) {
    loadData();
  }
}, [isAuthenticated]);

// Call after mutations
const handleAddTransaction = async (data: TransactionFormData) => {
  await api.addTransaction(data);
  await loadData();  // Refresh
};
```

---

## Data Flow Patterns

### 1. **Wrapper Pattern for Mutations**

```typescript
// ✅ CORRECT - Wrap API calls with data reload
const wrapAction = <T extends any[]>(action: (...args: T) => Promise<any>) => {
  return async (...args: T) => {
    await action(...args);
    await loadData();  // Auto-reload after action
  };
};

const handleAddCategoryBudget = wrapAction(api.addCategoryBudget);
const handleUpdateCategory = wrapAction(api.updateCategory);
```

### 2. **Navigation Pattern**

```typescript
// ✅ CORRECT - Centralized navigation
const navigate = (page: Page) => {
  setCurrentPage(page);
};

// Pass to components
<Header onNavigate={navigate} currentPage={currentPage} />

// ❌ WRONG - Direct state manipulation in children
// Don't do: setCurrentPage('budgets') in child component
```

### 3. **Modal Management**

```typescript
// ✅ CORRECT - Modal state in parent
const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

const handleEditClick = (transaction: Transaction) => {
  setEditingTransaction(transaction);
};

{editingTransaction && (
  <EditTransactionModal
    isOpen={!!editingTransaction}
    onClose={() => setEditingTransaction(null)}
    onSave={handleUpdateTransaction}
    transaction={editingTransaction}
  />
)}
```

---

## Error Handling

### Frontend Error Handling

```typescript
// ✅ CORRECT - Try-catch with user feedback
const handleSaveTransaction = async (data: TransactionFormData) => {
  try {
    console.log('[App] Saving transaction:', data);
    await api.addTransaction(data);
    await loadData();
    setCurrentPage('dashboard');
  } catch (error) {
    console.error('[App] Failed to save transaction:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`Error saving transaction: ${errorMessage}`);
  }
};
```

### Backend Error Handling

```javascript
// ✅ CORRECT - Comprehensive error handling
app.post('/api/transactions/bulk', async (req, res) => {
  console.log('[BULK] Received bulk transaction request');
  
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    console.log('[BULK] Processing', items.length, 'items');
    
    if (items.length === 0) {
      return res.json({ ok: true });
    }
    
    const { data, error } = await supabase.from('transactions').insert(items);
    
    if (error) {
      console.error('[BULK] Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to bulk insert',
        details: error.message 
      });
    }
    
    console.log('[BULK] Successfully inserted', data.length, 'transactions');
    res.json({ ok: true, inserted: data.length });
    
  } catch (err) {
    console.error('[BULK] Unexpected error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  }
});
```

---

## Logging & Debugging

### Logging Standards

**Always use prefixes in logs:**
```javascript
// ✅ CORRECT - Prefixed logging
console.log('[App] Loading application data...');
console.log('[Dashboard] Calculating monthly expenses');
console.log('[API] Transaction created successfully:', id);
console.error('[Database] Failed to fetch budgets:', error);

// ❌ WRONG - No context
console.log('Loading data');
console.log(expenses);
```

### Debug Logging Levels

```javascript
// Operation start/end
console.log('[Component] Starting operation X');
console.log('[Component] Operation X completed successfully');

// Data logging (sample data)
console.log('[Component] Processing', items.length, 'items');
console.log('[Component] First item sample:', items[0]);

// State changes
console.log('[Component] State updated:', { oldValue, newValue });

// Errors
console.error('[Component] Operation failed:', error);
console.error('[Component] Error details:', { context, data });
```

---

## Security Considerations

### 1. **Environment Variables**

```typescript
// ✅ CORRECT - Use environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// ❌ WRONG - Hardcoded secrets
const apiKey = 'AIzaSy...';  // NEVER do this!
```

### 2. **Password Handling**

**WARNING:** Current implementation stores passwords in plain text. This is a known limitation.

```typescript
// ⚠️ CURRENT (Insecure, but documented)
await supabase.from('users').update({ 
  password: newPassword  // Plain text - TODO: hash with bcrypt
});

// 🔒 FUTURE (Recommended)
// const hashedPassword = await bcrypt.hash(newPassword, 10);
// await supabase.from('users').update({ password: hashedPassword });
```

### 3. **Token Encryption**

Google OAuth tokens ARE encrypted:

```javascript
// ✅ CORRECT - Encrypt sensitive tokens
const encryptedTokens = encryptJSON(oauth.credentials);
await setSetting('gcal_tokens', encryptedTokens);

// Decrypt when needed
const tokens = decryptJSON(encryptedValue);
```

---

## Things You Should NEVER Do

### ❌ 1. **Never Hardcode Colors**
```css
/* WRONG */
.element {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
}

/* CORRECT */
.element {
  color: var(--color-text-primary);
  background: var(--color-card-bg);
}
```

### ❌ 2. **Never Use Floating Point for Money**
```javascript
// WRONG
const amount = 25.50;
await supabase.from('transactions').insert({ amount });

// CORRECT
const amount = toCents(25.50);  // 2550
await supabase.from('transactions').insert({ amount });
```

### ❌ 3. **Never Use Timestamps for Dates**
```javascript
// WRONG
const today = new Date().toISOString();  // "2024-01-15T10:30:00.000Z"

// CORRECT
const today = new Date().toISOString().split('T')[0];  // "2024-01-15"
```

### ❌ 4. **Never Skip Data Reload After Mutations**
```typescript
// WRONG
const handleDelete = async (id: string) => {
  await api.deleteTransaction(id);
  // Missing: await loadData();
};

// CORRECT
const handleDelete = async (id: string) => {
  await api.deleteTransaction(id);
  await loadData();  // REQUIRED
};
```

### ❌ 5. **Never Create Custom Shadows**
```css
/* WRONG */
.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* CORRECT */
.card {
  @apply shadow-neu-3d;
  /* or */
  box-shadow: var(--color-shadow-elevation-md);
}
```

### ❌ 6. **Never Modify State Directly**
```typescript
// WRONG
transactions.push(newTransaction);
setTransactions(transactions);

// CORRECT
setTransactions([...transactions, newTransaction]);
// or
setTransactions(prev => [...prev, newTransaction]);
```

### ❌ 7. **Never Forget Activity Logging**
```javascript
// WRONG
await supabase.from('budgets').insert(data);
// Missing: await addActivity('CREATE', `Set budget for ${category}`);

// CORRECT
await supabase.from('budgets').insert(data);
await addActivity('CREATE', `Set budget for ${category} to €${amount}.`);
```

### ❌ 8. **Never Delete Tasks Permanently Without Soft Delete First**
```javascript
// WRONG - Direct permanent delete
await supabase.from('tasks').delete().eq('id', taskId);

// CORRECT - Soft delete first
DELETE /api/tasks/:id  // Sets deleted_at
// Then later (after 30 days or manual trigger):
DELETE /api/tasks/:id/permanent  // Only if deleted_at is set
```

---

## Deployment Configuration

### Local Development

```bash
# Start both frontend and backend
npm run dev:all

# Frontend: http://localhost:3000 (Vite)
# Backend: http://localhost:4000 (Express)
```

### Production Deployment (Render.com)

**Frontend URL:** https://probudget-frontend.onrender.com  
**Backend URL:** https://probudget-backend.onrender.com

**Backend Environment Variables:**
```env
DATABASE_URL=<supabase_connection_string>
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_anon_key>
GEMINI_API_KEY=<your_gemini_key>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
GOOGLE_REDIRECT_URI=https://probudget-backend.onrender.com/api/calendar/callback
ENCRYPTION_KEY=<32_character_key>
```

**Frontend Environment Variables:**
```env
VITE_API_BASE_URL=https://probudget-backend.onrender.com
VITE_GEMINI_API_KEY=<your_gemini_key>
```

### CORS Configuration

Backend MUST allow frontend origins:

```javascript
// server/index.js
const allowedOrigins = [
  'https://probudget-frontend.onrender.com',  // Production
  'http://localhost:3000',                     // Local dev (Vite configured port)
  'http://localhost:5173',                     // Local dev (Vite default port)
  'http://localhost:4173',                     // Vite preview
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

## Testing & Validation

### Before Committing Code

**Checklist:**
- [ ] All theme variables used (no hardcoded colors)
- [ ] Logging added for all operations
- [ ] Data reload called after mutations
- [ ] Error handling implemented
- [ ] Activity logging added for user actions
- [ ] DATE format used for all dates
- [ ] Cents used for all monetary amounts
- [ ] Labels capitalized properly
- [ ] 3D design system followed
- [ ] Tested in all 4 themes
- [ ] No console errors in browser
- [ ] No server errors in terminal

### Manual Testing Steps

1. **Theme Testing:**
   ```
   - Switch to Dark Blue theme → verify colors
   - Switch to Light theme → verify colors
   - Switch to Dark theme → verify colors
   - Select custom color → verify generation
   ```

2. **Data Flow Testing:**
   ```
   - Create item → verify it appears in list
   - Update item → verify changes reflected
   - Delete item → verify removal from list
   - Check activity log updated
   ```

3. **Receipt Scanning:**
   ```
   - Upload clear receipt → verify items extracted
   - Edit items → verify changes persist
   - Save all → verify transactions created
   ```

4. **Task Management:**
   ```
   - Create todo task → verify in todo view
   - Create schedule task → verify in board/calendar
   - Update progress → verify slider works
   - Delete task → verify in trashbox
   - Restore task → verify back in active list
   ```

---

## Quick Reference

### Common Operations Checklist

#### Adding a New Feature
1. Update `types.ts` if new data types needed
2. Add database migration SQL if schema changes
3. Create API endpoints in `server/index.js`
4. Add API client functions in `services/api.ts`
5. Create/update React components
6. Add activity logging
7. Update documentation
8. Test in all themes

#### Modifying Existing Feature
1. Identify all affected files
2. Add logging for debugging
3. Maintain existing patterns
4. Reload data after mutations
5. Test thoroughly

#### Bug Fixing
1. Add logging to identify issue
2. Fix root cause
3. Add safeguards to prevent recurrence
4. Test edge cases
5. Verify fix doesn't break other features

---

## Summary

**Most Important Rules:**
1. 🎨 **Theme changes must be global** - update all occurrences
2. 📝 **Always add logging** - make debugging easier
3. 💰 **Store money as cents** - avoid floating point errors
4. 📅 **Store dates as DATE** - avoid timezone issues
5. 🔄 **Reload data after changes** - keep UI in sync
6. 🔍 **Follow existing patterns** - maintain consistency
7. 🚫 **Never skip error handling** - prevent crashes
8. ✅ **Always log activities** - maintain audit trail

**When in Doubt:**
- Look at existing code for similar functionality
- Follow the established patterns
- Add logging to understand what's happening
- Test thoroughly before committing

---

*This document is mandatory reading for anyone working on ProBudget Tracker.*  
*Following these rules ensures code quality, maintainability, and consistency.*