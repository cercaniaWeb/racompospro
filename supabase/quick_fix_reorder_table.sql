-- Quick Fix: Create reorder_suggestions table
-- Execute this in Supabase SQL Editor

-- Check if table exists, create if not
CREATE TABLE IF NOT EXISTS reorder_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  daily_sales_rate NUMERIC NOT NULL,
  days_until_depletion INTEGER NOT NULL,
  suggested_quantity INTEGER NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  estimated_depletion_date TIMESTAMPTZ NOT NULL,
  estimated_cost NUMERIC,
  supplier_name TEXT,
  lead_time_days INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'dismissed', 'expired')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_store_status 
  ON reorder_suggestions(store_id, status);
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_priority 
  ON reorder_suggestions(priority, days_until_depletion);

-- Enable RLS
ALTER TABLE reorder_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view suggestions for their stores"
  ON reorder_suggestions FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM user_stores 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update suggestions for their stores"
  ON reorder_suggestions FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM user_stores 
      WHERE user_id = auth.uid()
    )
  );

-- Success message
SELECT 'reorder_suggestions table created successfully! ✅' as message;
