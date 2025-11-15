# ProBudget Tracker

ProBudget Tracker is a comprehensive personal finance and productivity platform that combines advanced budgeting with intelligent task management. All data is securely stored in Supabase PostgreSQL database with real-time synchronization and Google services integration.

## ✨ Core Features

### 💰 Financial Management
- **Interactive Dashboard:** Comprehensive overview of financial health with budget progress, recent transactions, and spending insights
- **AI-Powered Receipt Scanning:** Scan receipts with Google Gemini AI to automatically extract items, amounts, quantities, and categories with multi-language support (German to English translation)
- **Smart Transaction Management:** Add, view, edit, delete transactions with advanced filtering, pagination, and search capabilities
- **Category Budgeting:** Create monthly overall budgets and category-specific budgets with visual progress tracking
- **Recurring Transactions:** Automate monthly transactions with intelligent due date generation
- **Savings Goals:** Set and track monthly savings targets with progress visualization
- **Custom Categories:** Create personalized income and expense categories with full CRUD operations
- **Advanced Analytics:** Detailed charts and reports with category breakdowns, trends, and time-based analysis
- **AI Financial Advisor:** Chat with AI assistant for insights, summaries, and financial analysis

### 📋 Task & Project Management
- **Dual-Mode Interface:** Seamlessly switch between Budget and Planner sections
- **Task Dashboard:** Organized view with Today, Tomorrow, Overdue, and Someday sections
- **Kanban Board:** Visual progress tracking with New, Scheduled, In Progress, Completed, and Backlog columns
- **Calendar Integration:** Full calendar view with Google Calendar sync and Google Tasks integration
- **Smart Task Management:** Tasks with priorities, due dates, notes, subtasks, labels, and recurring patterns
- **Project Backlog:** Organize and prioritize future tasks and ideas

### 🎨 Customization & Themes
- **Advanced Theme System:** Four built-in themes (Dark Blue, Light, Dark, Custom) with instant switching
- **Custom Theme Generator:** Create personalized themes with intelligent color palette generation from a single base color
- **Responsive Design:** Optimized for desktop, tablet, and mobile with consistent user experience
- **Persistent Preferences:** All theme settings, usernames, and preferences saved and restored automatically

### 🔐 Security & Authentication
- **Multi-User Support:** User-based authentication with username/password system
- **Security Questions:** Password recovery system with security question verification
- **Encrypted Storage:** Sensitive data like API tokens encrypted with AES-256-GCM
- **Activity Logging:** Comprehensive audit trail of all user actions and changes

### 🌐 Integrations & AI
- **Google Calendar:** Two-way sync with calendar events, create events from tasks
- **Google Tasks:** Import and manage Google Tasks within the application
- **Google Gemini AI:** Powers receipt scanning and financial advisory features
- **Real-time Updates:** Live data synchronization across all components

## 🛠️ Tech Stack

**Frontend:**
- **React 19.2.0** with TypeScript for type-safe component development
- **Tailwind CSS** with custom CSS variables for advanced theming system
- **Recharts** for interactive financial charts and data visualization
- **Vite** for fast development and optimized builds

**Backend:**
- **Node.js + Express** REST API server with comprehensive endpoints
- **Supabase** PostgreSQL database with real-time capabilities and Row Level Security
- **Google APIs** for Calendar, Tasks, and Gemini AI integration
- **AES-256-GCM Encryption** for sensitive data protection

**AI & Integrations:**
- **Google Gemini 2.5 Flash** for receipt scanning and financial advisory
- **Google Calendar API** for calendar events synchronization  
- **Google Tasks API** for task management integration
- **OAuth 2.0** for secure Google services authentication

**Development Tools:**
- **TypeScript** for enhanced code quality and development experience
- **Concurrently** for running frontend and backend simultaneously
- **dotenv** for environment variable management

## 📂 Project Structure

```
/
├── components/
│   ├── Budget & Financial Components
│   │   ├── Dashboard.tsx              # Main financial dashboard
│   │   ├── AddTransaction.tsx         # Transaction creation with AI receipt scanning
│   │   ├── TransactionsPage.tsx       # Transaction management with filtering/pagination
│   │   ├── ReceiptConfirmationPage.tsx # AI-scanned receipt review interface
│   │   ├── Budgets.tsx                # Budget and savings management
│   │   ├── CategoriesPage.tsx         # Custom category management
│   │   ├── ReportsPage.tsx            # Analytics charts and AI advisor
│   │   ├── EditTransactionModal.tsx   # Transaction editing interface
│   │   └── BudgetCard.tsx             # Budget visualization components
│   ├── Planner & Task Components
│   │   ├── planner/
│   │   │   ├── PlannerDashboard.tsx   # Task overview with calendar integration
│   │   │   ├── PlannerBoard.tsx       # Kanban-style task board
│   │   │   ├── PlannerCalendar.tsx    # Full calendar view with Google sync
│   │   │   ├── PlannerBacklog.tsx     # Task backlog management
│   │   │   ├── PlannerHeader.tsx      # Planner navigation
│   │   │   └── TaskModal.tsx          # Task creation/editing interface
│   ├── Authentication & Settings
│   │   ├── LoginPage.tsx              # Multi-step authentication
│   │   ├── SettingsPage.tsx           # User preferences and activity log
│   │   ├── ThemeSelector.tsx          # Advanced theme customization
│   │   └── TopSwitcher.tsx            # Budget/Planner mode switching
│   ├── UI Components
│   │   ├── Header.tsx                 # Main navigation header
│   │   ├── ChatModal.tsx              # AI financial advisor interface
│   │   ├── Pagination.tsx             # Data pagination component
│   │   └── icons/                     # Comprehensive icon library
├── services/
│   └── api.ts                         # Frontend API client with full endpoint coverage
├── server/
│   ├── index.js                       # Express server with 40+ REST endpoints
│   ├── supabaseClient.js              # Database connection and configuration
│   └── migrations/                    # Database schema and setup
├── utils/
│   ├── theme.ts                       # Advanced theme generation algorithms
│   ├── formatters.ts                  # Data formatting utilities
│   └── file.ts                        # File handling utilities
├── types.ts                           # Comprehensive TypeScript definitions
├── App.tsx                            # Root component with state management
├── vite.config.ts                     # Build configuration with proxy setup
└── render.yaml                        # Production deployment configuration
```

## 🧩 Key Components & Features

**Core Application (`App.tsx`):**
- Dual-mode application (Budget/Planner) with shared authentication
- Real-time data synchronization with automatic refresh
- Advanced state management with optimistic updates
- Google services integration with OAuth 2.0 flow

**Financial Management:**
- **Dashboard:** Real-time financial overview with budget progress and spending insights
- **Smart Transactions:** AI-powered receipt scanning with multi-language support
- **Advanced Analytics:** Interactive charts with category breakdowns and trend analysis
- **Budget Tracking:** Monthly overall budgets and category-specific budget management
- **Recurring Automation:** Monthly recurring transactions with automatic generation

**Task & Project Management:**
- **Planner Dashboard:** Task organization with Today/Tomorrow/Overdue/Someday views
- **Kanban Board:** Visual task management with drag-and-drop status updates
- **Calendar Integration:** Google Calendar sync with two-way event synchronization
- **Google Tasks:** Import and manage Google Tasks within the application

**AI-Powered Features:**
- **Receipt Scanning:** Gemini AI extracts items, amounts, quantities, and suggests categories
- **Financial Advisor:** AI chat assistant for spending analysis and financial insights
- **Multi-language Support:** Automatic translation of German receipts to English

**Advanced Theming:**
- **Dynamic Color Generation:** Algorithmic theme palette generation from single color
- **Four Built-in Themes:** Dark Blue, Light, Dark, and Custom themes
- **CSS Variable System:** Advanced theming with real-time color updates
- **Responsive Design:** Consistent experience across all device sizes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm 9+

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables by creating a `.env` file at the project root:

   ```env
   # Required: Supabase Configuration (Core Database)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # Required: Google Gemini AI (Receipt Scanning & Financial Advisor)
   GEMINI_API_KEY=your_google_gemini_api_key_here
   
   # Optional: Google Services Integration (Calendar & Tasks)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:4000/api/calendar/callback
   
   # Optional: Security (Token Encryption)
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

   **To get your credentials:**
   - **Supabase:** [Dashboard](https://app.supabase.com) → Project Settings → API
   - **Google Gemini:** [Google AI Studio](https://makersuite.google.com/app/apikey) → Create API Key  
   - **Google OAuth:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

3. Set up your Supabase database:
   - Database schema is automatically created when you first run the application
   - Default categories and initial data are seeded on first use
   - User authentication tables are created automatically

### Development

Start both backend and frontend concurrently:

```bash
npm run dev:all
```

This runs:
- **Backend:** http://localhost:4000 (Express + Supabase + Google APIs)
- **Frontend:** http://localhost:3000 (Vite + React, proxies `/api` to backend)

Or run separately in different terminals:

```bash
npm run server    # Backend only
npm run dev       # Frontend only
```

**First Run Setup:**
1. Visit http://localhost:3000
2. Create your user account (first user becomes admin)
3. Configure your preferences and themes
4. Optionally connect Google Calendar for enhanced planning features

**Available Features:**
- **Budget Mode:** Complete financial management with AI receipt scanning
- **Planner Mode:** Task management with Google Calendar/Tasks integration
- **Theme Customization:** Real-time theme switching and custom color generation
- **AI Features:** Receipt scanning and financial advisor (requires Gemini API key)

### Build & Preview

```bash
npm run build
npm run preview
```

Note: The production build expects the backend to be running and reachable at the same origin (or configure a reverse proxy). During development, Vite proxies `/api` to the backend.

## 📚 API Endpoints

### Financial Management
- `GET /api/transactions` — List transactions with labels and filtering
- `POST /api/transactions` — Create single transaction
- `PUT /api/transactions/:id` — Update transaction with labels
- `DELETE /api/transactions/:id` — Delete transaction
- `POST /api/transactions/bulk` — Create multiple transactions (receipt processing)

### Budgets & Savings
- `GET /api/budgets` — List all budgets
- `POST /api/budgets/category` — Create category-specific budget
- `PUT /api/budgets/:id` — Update budget amount
- `POST /api/budgets/overall` — Create/update overall monthly budget
- `GET /api/savings` — List savings goals
- `POST /api/savings/upsert` — Create/update monthly savings

### Categories & Labels
- `GET /api/categories` — List all categories
- `POST /api/categories` — Create custom category
- `PUT /api/categories/:id` — Update category (propagates to transactions)
- `DELETE /api/categories/:id` — Delete category with validation

### Recurring Transactions
- `GET /api/recurring` — List recurring transaction templates
- `POST /api/recurring` — Create recurring transaction
- `DELETE /api/recurring/:id` — Delete recurring transaction
- `POST /api/recurring/generate-due` — Generate due recurring instances

### Task & Project Management
- `GET /api/tasks` — List all tasks with subtasks
- `POST /api/tasks` — Create task with subtasks and labels
- `PUT /api/tasks/:id` — Update task (syncs with Google Calendar/Tasks)
- `DELETE /api/tasks/:id` — Delete task
- `GET /api/tasks/agenda` — Get agenda view (today/week/overdue)

### Google Services Integration
- `GET /api/calendar/auth-url` — Get OAuth authorization URL
- `GET /api/calendar/callback` — OAuth callback handler
- `GET /api/calendar/events` — List calendar events with time range
- `POST /api/calendar/events` — Create calendar event
- `PUT /api/calendar/events/:id/toggle` — Toggle event status
- `GET /api/calendar/disconnect` — Disconnect Google services
- `GET /api/google-tasks` — List Google Tasks
- `PUT /api/google-tasks/:id/toggle` — Toggle Google Task completion

### Authentication & Settings
- `POST /api/auth/login` — User login with username/password
- `POST /api/auth/verify-security-question` — Security question verification
- `POST /api/auth/reset-password` — Password reset with security answer
- `GET /api/settings` — Get user preferences (theme, username, etc.)
- `POST /api/settings` — Update user preferences
- `GET /api/activity` — Get comprehensive activity audit log

## 🔒 Security & Data Management

### Data Persistence
- **Supabase PostgreSQL:** All application data stored with ACID compliance
- **Real-time Sync:** Automatic data synchronization across components
- **Data Encryption:** Sensitive tokens encrypted with AES-256-GCM
- **Row Level Security:** User-based data isolation in Supabase

### Authentication System
- **Multi-User Support:** Individual user accounts with secure authentication
- **Password Recovery:** Security question-based password reset system
- **Session Management:** Secure session handling with automatic expiry
- **Activity Logging:** Comprehensive audit trail of all user actions

### Google Services Integration
- **OAuth 2.0 Flow:** Secure authentication for Google services
- **Encrypted Token Storage:** API tokens encrypted and securely stored
- **Calendar Sync:** Two-way synchronization with Google Calendar
- **Tasks Integration:** Google Tasks management within the application

## 🚀 Production Deployment

ProBudget Tracker is designed for easy deployment on Render with separate frontend and backend services.

### Prerequisites for Deployment
- Supabase project with database setup
- Google Cloud Console project (for AI and Calendar features)
- Render account for hosting

### 1. Backend Web Service

Create a **Web Service** in Render:

**Configuration:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Auto Deploy:** Enable for Git-based deployments
- **Runtime:** Node.js (latest)

**Environment Variables:**
```env
# Core Database (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Features (Required for receipt scanning)
GEMINI_API_KEY=your_gemini_api_key

# Google Integration (Optional but recommended)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/api/calendar/callback

# Security (Recommended)
ENCRYPTION_KEY=generate_a_32_character_secure_key
```

### 2. Frontend Static Site

Create a **Static Site** in Render:

**Configuration:**
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Auto Deploy:** Enable for Git-based deployments

### 3. Domain Configuration

**Backend Service:**
- Note your backend URL: `https://your-backend.onrender.com`
- Update Google OAuth redirect URI to match this URL

**Frontend Service:**
- Configure custom domain if desired
- Frontend automatically connects to backend at `/api/*` endpoints

### 4. Database Setup

**Supabase Configuration:**
1. Create tables automatically on first run
2. Set up Row Level Security policies
3. Configure user authentication
4. Seed default categories and data

### 5. Google Services Setup

**For Calendar & Tasks Integration:**
1. Enable Google Calendar API and Google Tasks API
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Configure scope permissions

**For AI Features:**
1. Enable Gemini API in Google AI Studio
2. Generate and secure API key
3. Test receipt scanning functionality

### 6. Infrastructure as Code

Use the included `render.yaml` for automated deployment:

```bash
# Deploy via Render Blueprint
render-cli deploy --blueprint render.yaml
```

### 7. Security Considerations

**Production Security Checklist:**
- [ ] Rotate all API keys before deployment
- [ ] Enable HTTPS only for all services
- [ ] Configure CORS for specific origins
- [ ] Set strong encryption keys
- [ ] Enable Supabase Row Level Security
- [ ] Regular security audits and updates

### 8. Monitoring & Maintenance

**Health Checks:**
- Backend service automatically monitored
- Database connection verification
- API endpoint availability
- Google services integration status

**Backup Strategy:**
- Supabase handles automated database backups
- Export user data via admin dashboard
- Monitor storage and bandwidth usage

### 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| API 404 Errors | Verify backend URL and API proxy configuration |
| Google OAuth Failed | Check redirect URIs and client credentials |
| Database Connection Issues | Verify Supabase URL and API key |
| Receipt Scanning Not Working | Confirm Gemini API key and quota |
| Theme Not Persisting | Check database connection and settings API |

## 🌟 What Makes ProBudget Tracker Unique

### Dual-Purpose Platform
- **Seamless Integration:** Switch between financial management and productivity planning in one unified interface
- **Shared Data Model:** Tasks can influence budgets (e.g., project expenses) and financial goals can drive task priorities

### Advanced AI Integration
- **Multi-Language Receipt Processing:** Automatically translates and processes receipts in multiple languages
- **Contextual Financial Advice:** AI advisor that understands your spending patterns and financial goals
- **Smart Categorization:** Intelligent category suggestions based on transaction history and patterns

### Sophisticated Theme System
- **Algorithmic Color Generation:** Mathematical approach to creating harmonious color palettes from a single input
- **Real-time Theme Updates:** Instant visual feedback when customizing themes
- **Accessibility Focused:** Contrast ratios and readability optimized across all themes

### Production-Ready Architecture
- **Microservices Approach:** Clean separation between frontend, backend, and external services
- **Real-time Synchronization:** Live updates across all components and devices
- **Enterprise Security:** Encryption, audit logging, and user isolation built-in
- **Scalable Design:** Ready for multi-tenant deployment and horizontal scaling

## 📈 Development Roadmap

### Upcoming Features
- [ ] **Mobile App:** React Native app with offline capability
- [ ] **Advanced Analytics:** Machine learning insights and predictions
- [ ] **Team Collaboration:** Shared budgets and collaborative planning
- [ ] **Bank Integration:** Direct bank account synchronization
- [ ] **Investment Tracking:** Portfolio management and investment analysis
- [ ] **Multi-Currency Support:** International finance management
- [ ] **Automated Categorization:** AI-powered transaction categorization
- [ ] **Advanced Reporting:** Custom report builder and scheduled exports

### Technical Improvements
- [ ] **Offline Mode:** Progressive Web App capabilities
- [ ] **Real-time Collaboration:** Live editing and sharing features
- [ ] **Performance Optimization:** Advanced caching and lazy loading
- [ ] **Accessibility Enhancements:** Full WCAG 2.1 compliance
- [ ] **API Documentation:** Comprehensive OpenAPI specification
- [ ] **Testing Coverage:** End-to-end testing and performance benchmarks

---

**ProBudget Tracker** - Comprehensive personal finance and productivity management platform.  
Built with ❤️ using React, TypeScript, Supabase, and Google AI.

For support, feature requests, or contributions, please visit our [GitHub repository](https://github.com/Sandeep0076/Probudget-Tracker).