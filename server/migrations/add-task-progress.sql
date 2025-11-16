-- Add progress column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Set default progress to 0 for existing tasks
UPDATE tasks SET progress = 0 WHERE progress IS NULL;