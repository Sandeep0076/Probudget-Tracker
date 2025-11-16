-- Create shopping_items table for the To Buy list feature
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ
);

-- Create index on completed status for faster filtering
CREATE INDEX idx_shopping_items_completed ON shopping_items (completed);

-- Create index on priority for sorting
CREATE INDEX idx_shopping_items_priority ON shopping_items (priority);

-- Create index on category for grouping/filtering
CREATE INDEX idx_shopping_items_category ON shopping_items (category);
