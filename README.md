# ProBudget Tracker

ProBudget Tracker is a modern budget tracking application with full persistence. All data (transactions, budgets, categories, savings, recurring items, settings, activity log) is stored in a SQLite database file located at the project root. The UI offers a sleek, customizable experience with AI-powered receipt scanning and comprehensive reporting features.

## ✨ Features

- **Persistent Data Storage:** All data is saved to a SQLite file `probudget.sqlite` in the project root and is loaded automatically on app start.
- **Interactive Dashboard:** A comprehensive overview of your financial health at a glance, including budget progress and recent transactions.
- **AI-Powered Receipt Scanning:** Quickly add expenses by scanning receipts. The app uses AI to automatically extract items, amounts, and categories, which you can review and confirm.
- **Full Transaction Management:** Easily add, view, edit, and delete all your income and expense transactions. A powerful filtering system helps you find exactly what you're looking for.
- **Comprehensive Budgeting:** Create a monthly overall budget and specific budgets for different expense categories. Track your spending against them with clear visual progress bars.
- **Savings Goals:** Set and track your monthly savings goals to stay on top of your financial objectives.
- **Custom Category Management:** Create, edit, and delete your own personalized income and expense categories for a fully tailored budgeting experience.
- **In-depth Reporting:** Visualize your spending patterns with detailed charts, breaking down expenses by category and label over various time periods.
- **AI Financial Advisor:** Chat with an AI assistant to get insights, summaries, and analysis based on your financial data.
- **Persistent Theme Selection:** Choose between multiple built-in themes or create your own with a custom color picker. Your theme and color are saved in the database and applied automatically on your next visit.
- **Detailed Activity Log:** A comprehensive log in the Settings page keeps track of all important changes, such as creating, updating, or deleting transactions, categories, and budgets.
- **Responsive Design:** A fully responsive layout that looks great on desktops, tablets, and mobile devices.

## 🛠️ Tech Stack

- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that adds static types for more robust code.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development and custom designs.
- **Recharts:** A composable charting library built on React components, used for financial reports.
- **Node + Express:** Backend server that exposes REST APIs for all features.
- **SQLite (better-sqlite3):** Fast embedded database used to persist data in `probudget.sqlite`.
- **Google Gemini API:** Powers the AI receipt scanning and financial advisor chat features.

## 📂 Project Structure

The project is organized into frontend components, a simple backend server, and shared types.

```
/
├── components/
│   ├── icons/
│   ├── AddBudgetModal.tsx
│   ├── AddTransaction.tsx
│   ├── BudgetCard.tsx
│   ├── Budgets.tsx
│   ├── CategoriesPage.tsx
│   ├── CategoryModal.tsx
│   ├── ChatMessageItem.tsx
│   ├── ChatModal.tsx
│   ├── Dashboard.tsx
│   ├── EditTransactionModal.tsx
│   ├── ExpenseChart.tsx
│   ├── Header.tsx
│   ├── OverallBudgetCard.tsx
│   ├── OverallBudgetModal.tsx
│   ├── Pagination.tsx
│   ├── ReceiptConfirmationPage.tsx
│   ├── ReceiptItemEditor.tsx
│   ├── RecentTransactions.tsx
│   ├── ReportsPage.tsx
│   ├── SavingsModal.tsx
│   ├── SettingsPage.tsx
│   ├── TransactionListItem.tsx
│   └── TransactionsPage.tsx
├── services/
│   └── api.ts          # Frontend REST client talking to the backend
├── server/
│   └── index.js        # Node/Express backend with SQLite (better-sqlite3)
├── utils/
│   ├── file.ts
│   ├── formatters.ts
│   └── theme.ts
├── App.tsx
├── index.html
├── index.tsx
├── metadata.json
├── types.ts
├── probudget.sqlite     # Created on first server start (persisted data)
└── ...
```

## 🧩 Component Breakdown

- **`App.tsx`**: The root component that manages application state and orchestrates data flow via the REST API.
- **`services/api.ts`**: Frontend API client. Wraps fetch calls to the backend for transactions, budgets, categories, savings, recurring items, settings, and activity log.
- **`server/index.js`**: Express server. Hosts REST endpoints and persists data to `probudget.sqlite`. Initializes schema and seeds default categories on first run.
- **`Header.tsx`**: The main navigation bar at the top of the page.
- **`Dashboard.tsx`**: The main screen of the application, aggregating various components to provide a complete financial overview.
- **`Budgets.tsx`**: The page for viewing and managing monthly budgets and savings goals.
- **`TransactionsPage.tsx`**: A dedicated page to view, filter, and paginate all user transactions.
- **`CategoriesPage.tsx`**: A page allowing users to create, edit, and delete their own custom transaction categories.
- **`ReportsPage.tsx`**: A page that provides detailed charts and an AI chat advisor for financial analysis.
- **`SettingsPage.tsx`**: A page for managing application settings, including persistent theme selection and viewing a detailed activity log of all changes.
- **`AddTransaction.tsx`**: A form for users to input details for a new transaction, featuring an AI receipt scanning option.
- **`EditTransactionModal.tsx`**: A modal form that allows users to edit the details of an existing transaction.
- **`ReceiptConfirmationPage.tsx`**: A page where users can review, edit, or remove items extracted from a scanned receipt before saving them as transactions.
- **`ChatModal.tsx`**: A modal interface for interacting with the AI Financial Advisor.
- **`types.ts`**: Contains all TypeScript definitions, interfaces, and enums used across the application.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm 9+

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Configure AI API key for receipt scanning by creating a `.env` file at the project root:

   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

   Vite exposes `process.env.API_KEY` to the frontend from this variable.

### Development

- Start backend and frontend in one command:

  ```bash
   npm run dev:all
   ```

  This runs:
  - Backend: http://localhost:4000 (Express + SQLite `probudget.sqlite`)
  - Frontend: http://localhost:3000 (Vite, proxies `/api` to backend)

- Or run in two terminals:

  ```bash
   npm run server    # start backend
   npm run dev       # start frontend
   ```

Visit http://localhost:3000 in your browser. Data will persist in `./probudget.sqlite`.

### Build & Preview

```bash
npm run build
npm run preview
```

Note: The production build expects the backend to be running and reachable at the same origin (or configure a reverse proxy). During development, Vite proxies `/api` to the backend.

## 📚 API Overview (Backend)

- `GET /api/transactions` — list transactions
- `POST /api/transactions` — create transaction
- `PUT /api/transactions/:id` — update transaction
- `DELETE /api/transactions/:id` — delete transaction
- `POST /api/transactions/bulk` — create multiple transactions (receipt save all)
- `GET /api/budgets` — list budgets
- `POST /api/budgets/category` — add category budget
- `POST /api/budgets/overall` — add/update overall budget
- `GET /api/categories` — list categories
- `POST /api/categories` — create category
- `PUT /api/categories/:id` — rename category (also updates related transactions and budgets)
- `DELETE /api/categories/:id` — delete category
- `GET /api/savings` — list savings
- `POST /api/savings/upsert` — add/update savings for a month
- `GET /api/recurring` — list recurring transactions
- `POST /api/recurring` — create recurring transaction
- `DELETE /api/recurring/:id` — delete recurring transaction
- `POST /api/recurring/generate-due` — generate due recurring instances
- `GET /api/activity` — list activity log
- `GET /api/settings` — get theme and custom color
- `POST /api/settings` — set theme and custom color

## 🔒 Data Persistence

- The application stores all data in `probudget.sqlite` at the project root.
- The database is created automatically on first server start and seeded with default categories.