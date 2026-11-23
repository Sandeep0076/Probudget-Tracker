# ProBudget Tracker

A full-stack personal finance and task management application featuring budget tracking, expense management, AI-powered receipt scanning, recurring transactions, and an integrated planner with Google Calendar sync.

## 🌟 Features

### Budget Management
- **Overall & Category Budgets**: Set monthly budgets for overall spending and specific categories
- **Real-time Tracking**: Visual progress bars showing budget utilization
- **Budget vs Actual Analysis**: Compare planned vs actual spending
- **Savings Goals**: Track monthly savings targets

### Transaction Management
- **Income & Expense Tracking**: Comprehensive transaction logging
- **AI Receipt Scanning**: Upload receipt images for automatic transaction extraction using Google Gemini AI
- **Recurring Transactions**: Set up monthly recurring income/expenses with automatic generation
- **Labels & Categories**: Organize transactions with customizable labels and categories
- **Bulk Import**: Process multiple transactions from scanned receipts at once

### Analytics & Reports
- **Interactive Dashboards**: Visual spending trends with charts
- **Monthly Reports**: Compare spending across different time periods
- **Category Breakdown**: Pie charts and bar graphs for expense distribution
- **Budget Variance Analysis**: Track over/under budget amounts
- **Time Series Analysis**: Spending trends over time

### Task & Planner Management
- **Dual Task System**:
  - **Todo Tasks**: Short-term, quick tasks
  - **Schedule Tasks**: Long-term projects with progress tracking
- **Kanban Board**: Drag-and-drop task management with status columns (New, Scheduled, In Progress, Completed, Backlog)
- **Calendar View**: FullCalendar integration for schedule visualization
- **Progress Tracking**: Track task completion percentage for schedule tasks
- **Subtasks**: Break down tasks into manageable subtasks
- **Shopping List**: Dedicated "To Buy" list with priority management
- **Trashbox**: Soft-delete system with 30-day retention

### Google Integration
- **Calendar Sync**: Import Google Calendar events as tasks
- **Google Tasks Import**: Sync Google Tasks to local planner
- **OAuth2 Authentication**: Secure Google account connection
- **Automatic Token Refresh**: Maintains connection without re-authentication

### User Experience
- **4 Theme Options**: Dark Blue (default), Light, Dark, and Custom
- **Custom Theme Generator**: Create personalized themes from any color
- **3D Neumorphic Design**: Modern glassmorphic UI with depth and shadows
- **Responsive Layout**: Mobile-friendly design
- **Login System**: Password-protected access with security question recovery

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0**: UI framework
- **TypeScript 5.8.2**: Type-safe development
- **Vite 6.2.0**: Build tool and dev server
- **Tailwind CSS 3.4.14**: Utility-first styling
- **FullCalendar 6.1.15**: Calendar views
- **@dnd-kit**: Drag-and-drop functionality
- **Recharts 3.3.0**: Data visualization
- **Google Gemini AI**: Receipt scanning

### Backend
- **Node.js + Express 4.21.1**: REST API server
- **Supabase**: PostgreSQL database (managed)
- **Google APIs**: Calendar and Tasks integration
- **CORS**: Cross-origin resource sharing
- **Crypto**: Data encryption for sensitive information

### Deployment
- **Render.com**: Frontend and backend hosting
- **Supabase Cloud**: Database hosting
- **Environment-based Configuration**: Separate dev/prod settings

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Supabase Account**: For database (https://supabase.com)
- **Google Gemini API Key**: For receipt scanning (https://ai.google.dev)
- **Google Cloud Project** (Optional): For Calendar/Tasks sync

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd probudget-tracker
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm install
```

### 3. Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to Project Settings > API
3. Copy your:
   - Project URL (SUPABASE_URL)
   - Anon/Public Key (SUPABASE_ANON_KEY)

4. Run the database migrations in Supabase SQL Editor:
   - Navigate to `server/migrations/` folder
   - Execute each `.sql` file in the SQL Editor:
     - `add-security-question.sql` (Required for login)
     - `add-task-completed-at.sql` (Task completion tracking)
     - `add-shopping-items.sql` (Shopping list feature)
     - `add-task-progress.sql` (Task progress tracking)
     - `add-category-affects-budget.sql` (Category budget control)

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI (for receipt scanning)
GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Security (generate a random 32-character string)
ENCRYPTION_KEY=your_32_character_encryption_key

# Optional: Google Calendar/Tasks Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/calendar/callback

# Port Configuration
PORT=4000
```

### 5. Run the Application

#### Development Mode (Both Frontend & Backend)

```bash
npm run dev:all
```

This starts:
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:4000 (Express API)

#### Individual Services

```bash
# Frontend only
npm run dev

# Backend only
npm run server
```

#### Production Build

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## 🔐 Default Login

After running the database migrations, a default user is created:

- **Username**: `Mr and Mrs Pathania`
- **Password**: `password`
- **Security Question**: `What is your favorite color?`
- **Security Answer**: `blue`

**⚠️ Change these immediately after first login!**

## 🌐 Deployment

### Render.com Deployment

The project is configured for Render.com deployment:

1. **Backend Service**:
   - Type: Web Service
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment Variables: Set all backend env vars in Render dashboard

2. **Frontend Service**:
   - Type: Static Site
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_API_BASE_URL`: Your backend service URL
     - `VITE_GEMINI_API_KEY`: Your Gemini API key

3. Update `render.yaml` with your actual service URLs and environment variables

### Environment Variables for Production

**Backend (Render.com)**:
```
DATABASE_URL=<supabase_connection_string>
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_anon_key>
GEMINI_API_KEY=<your_gemini_key>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/api/calendar/callback
ENCRYPTION_KEY=<32_char_key>
```

**Frontend (Render.com)**:
```
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_GEMINI_API_KEY=<your_gemini_key>
```

## 📁 Project Structure

```
probudget-tracker/
├── components/           # React components
│   ├── icons/           # SVG icon components
│   ├── planner/         # Planner-specific components
│   ├── reports/         # Analytics & reporting components
│   └── *.tsx            # Main UI components
├── server/              # Backend Express server
│   ├── migrations/      # Database migration scripts
│   ├── index.js         # Main server file
│   └── supabaseClient.js # Database connection
├── services/            # Frontend API client
│   └── api.ts           # API service layer
├── utils/               # Utility functions
│   ├── theme.ts         # Theme generation
│   └── formatters.ts    # Data formatting utilities
├── types.ts             # TypeScript type definitions
├── App.tsx              # Main React application
├── index.tsx            # React entry point
├── index.css            # Global styles & theme CSS
├── tailwind.config.js   # Tailwind configuration
├── vite.config.ts       # Vite build configuration
└── package.json         # Dependencies & scripts
```

## 🎨 Theming

The application uses a sophisticated theming system with:

- **CSS Custom Properties**: All colors defined as CSS variables
- **4 Built-in Themes**: Dark Blue, Light, Dark, Custom
- **Dynamic Theme Generator**: Creates complete color palettes from a single base color
- **3D Design System**: Neumorphic shadows and glassmorphism effects

See [`UI-DESIGN-GUIDE.md`](UI-DESIGN-GUIDE.md) for detailed design system documentation.

## 🔑 Key Features Explained

### Receipt Scanning

1. Click "Add Transaction" → "Scan Receipt"
2. Upload a receipt image (JPG, PNG)
3. AI extracts items, amounts, and suggests categories
4. Review and edit items before saving
5. All items saved as individual transactions

### Recurring Transactions

1. Create a recurring transaction (e.g., monthly rent)
2. System automatically generates due transactions on schedule
3. View/edit recurring templates in Transactions page
4. Generated transactions linked to their recurring parent

### Task Progress Tracking

- **Todo Tasks**: Simple completion toggle
- **Schedule Tasks**: Progress slider (0-100%)
- **Automatic Purge**: Completed tasks auto-deleted after 30 days
- **Trashbox**: Recover soft-deleted tasks within 30 days

### Google Sync

1. Connect Google account in Settings
2. Click "Sync" in Planner to import:
   - Calendar events (past 30 days, future 90 days)
   - Google Tasks (all incomplete + recent completed)
3. Imported items become local tasks
4. No real-time sync - manual sync required

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure all migrations have been run

### Keep Supabase Alive workflow fails

The workflow reads one key from the `settings` table on Mondays and Thursdays.
Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` under repository
**Settings → Secrets and variables → Actions**. Use the current HTTPS Project URL
from the Supabase dashboard's **Connect** dialog (for example,
`https://your-project-ref.supabase.co`), and the service role key from the same
project. Keep the service role key in Actions secrets only.

- **curl exit 6**: The project hostname could not be resolved. The workflow retries
  temporary failures. If it still fails, compare the URL secret with the current
  Project URL and check the project's status in Supabase. Restore a paused project
  before retrying; a deleted project needs a valid replacement URL and key.
- **HTTP 401/403**: Check the service role key and database permissions.
- **HTTP 404**: Check the Project URL, Data API availability and `settings` table.

After correcting the configuration, use **Actions → Keep Supabase Alive → Run
workflow** to verify it. Scheduled runs use the default branch. Periodic requests
cannot restore a project that is already paused or guarantee it stays active.

### Receipt Scanning Not Working
- Verify `VITE_GEMINI_API_KEY` is set
- Check API key has proper permissions
- Ensure image is clear and readable

### CORS Errors
- Check backend URL in frontend config
- Verify `VITE_API_BASE_URL` points to correct backend
- Ensure backend CORS configuration allows frontend origin

### Tasks Not Showing Progress
- Run the `add-task-progress.sql` migration
- Or use the "Repair Database" option in Settings

## 📚 Additional Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) - Detailed technical architecture
- [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) - AI coding guidelines
- [`UI-DESIGN-GUIDE.md`](UI-DESIGN-GUIDE.md) - Complete UI/UX documentation
- [`server/migrations/README.md`](server/migrations/README.md) - Database migrations guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues, questions, or suggestions:
- Check existing documentation
- Review troubleshooting section
- Create an issue in the repository

---

**Built with ❤️ for personal finance management**