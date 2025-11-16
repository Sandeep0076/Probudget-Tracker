-- Migration: Add completed_at column to tasks table
-- This migration adds a completed_at timestamp column to track when tasks are completed

-- Add completed_at column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment to the column
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was marked as completed';

-- Create an index on completed_at for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Update existing completed tasks to have a completed_at timestamp
-- (set to updated_at if status is 'completed' and completed_at is null)
UPDATE tasks
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;