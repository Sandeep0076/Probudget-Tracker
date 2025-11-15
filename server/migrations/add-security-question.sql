-- Add security question and answer columns to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS security_question TEXT,
ADD COLUMN IF NOT EXISTS security_answer TEXT;

-- Update existing user with default security question/answer
UPDATE users
SET 
  security_question = 'What is the name of your first teacher?',
  security_answer = 'Gita'
WHERE id IN (SELECT id FROM users LIMIT 1);

-- If no users exist, insert a default user
INSERT INTO users (username, password, security_question, security_answer)
SELECT 'Mr and Mrs Pathania', 'password123', 'What is the name of your first teacher?', 'Gita'
WHERE NOT EXISTS (SELECT 1 FROM users);