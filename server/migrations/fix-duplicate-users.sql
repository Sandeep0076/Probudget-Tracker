-- Migration to fix duplicate users and prevent future duplicates
-- Created: 2025-12-30

-- Step 1: Identify and keep only the user with a valid password
-- Delete duplicate users that have EMPTY passwords
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  WHERE password IS NOT NULL AND password != ''
  GROUP BY username
)
AND (password IS NULL OR password = '');

-- Step 2: If there are still duplicates (multiple users with passwords), keep the newest
DELETE FROM users 
WHERE id NOT IN (
  SELECT MAX(id) 
  FROM users 
  GROUP BY username
);

-- Step 3: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE users 
ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Step 4: Add NOT NULL constraint to password (optional but recommended)
-- First update any remaining NULL passwords to empty string
UPDATE users SET password = '' WHERE password IS NULL;

-- Then add the constraint
ALTER TABLE users 
ALTER COLUMN password SET NOT NULL;

-- Step 5: Add constraint to prevent empty passwords at database level
ALTER TABLE users 
ADD CONSTRAINT users_password_not_empty CHECK (length(password) > 0);