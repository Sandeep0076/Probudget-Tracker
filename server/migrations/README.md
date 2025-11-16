# Database Migrations

## How to Run Migrations

1. Go to your Supabase project dashboard: https://supabase.com
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you want to run
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

## Available Migrations

### add-security-question.sql
Adds security question and answer columns to the users table for password reset functionality.

**What it does:**
- Adds `security_question` column to users table
- Adds `security_answer` column to users table
- Sets default values for existing users
- Creates a default user if none exists

**Run this first** before using the login/password reset features.

### add-task-completed-at.sql
Adds a `completed_at` timestamp column to the tasks table to track when tasks are finished.

**What it does:**
- Adds `completed_at` column to tasks table (nullable timestamp)
- Creates an index on `completed_at` for better query performance
- Backfills existing completed tasks with their `updated_at` timestamp

**Benefits:**
- Enables sorting tasks by completion date
- Allows filtering tasks completed within specific time ranges
- Provides historical data for task completion analytics
- The `created_at` column already exists and is automatically set on task creation

**Note:** The tasks table already has `created_at` and `updated_at` columns that are automatically managed by the database.