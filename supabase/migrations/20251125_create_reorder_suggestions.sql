-- Smart Reordering: Reorder Suggestions Table
-- This table stores AI-generated reorder suggestions for products

-- Create reorder_suggestions table
CREATE TABLE IF NOT EXISTS reorder_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Current stock analysis
    current_stock INTEGER NOT NULL,
    daily_sales_rate DECIMAL(10, 2) NOT NULL,
    days_until_depletion INTEGER NOT NULL,
    
    -- AI recommendation
    suggested_quantity INTEGER NOT NULL,
    confidence_score DECIMAL(3, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    estimated_depletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Order details
    estimated_cost DECIMAL(10, 2),
    supplier_name TEXT,
    lead_time_days INTEGER DEFAULT 0,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'dismissed', 'expired')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    
    -- AI analysis metadata
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_reasoning TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(product_id, store_id, status, analysis_date)
);

-- Add indexes for performance
CREATE INDEX idx_reorder_suggestions_product ON reorder_suggestions(product_id);
CREATE INDEX idx_reorder_suggestions_store ON reorder_suggestions(store_id);
CREATE INDEX idx_reorder_suggestions_status ON reorder_suggestions(status);
CREATE INDEX idx_reorder_suggestions_priority ON reorder_suggestions(priority);
CREATE INDEX idx_reorder_suggestions_depletion_date ON reorder_suggestions(estimated_depletion_date);

-- Enable RLS
ALTER TABLE reorder_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reorder suggestions for their stores"
    ON reorder_suggestions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_stores
            WHERE user_stores.store_id = reorder_suggestions.store_id
            AND user_stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reorder suggestions for their stores"
    ON reorder_suggestions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_stores
            WHERE user_stores.store_id = reorder_suggestions.store_id
            AND user_stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reorder suggestions for their stores"
    ON reorder_suggestions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_stores
            WHERE user_stores.store_id = reorder_suggestions.store_id
            AND user_stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reorder suggestions for their stores"
    ON reorder_suggestions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_stores
            WHERE user_stores.store_id = reorder_suggestions.store_id
            AND user_stores.user_id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reorder_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reorder_suggestions_updated_at
    BEFORE UPDATE ON reorder_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_reorder_suggestions_updated_at();

-- Function to auto-expire old suggestions
CREATE OR REPLACE FUNCTION expire_old_reorder_suggestions()
RETURNS void AS $$
BEGIN
    UPDATE reorder_suggestions
    SET status = 'expired'
    WHERE status = 'pending'
    AND estimated_depletion_date < NOW()
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE reorder_suggestions IS 'AI-generated inventory reorder suggestions based on sales patterns and stock levels';
