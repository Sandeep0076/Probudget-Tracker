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