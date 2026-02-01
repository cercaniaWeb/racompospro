# Smart Reordering - Setup & Deployment Guide

## Prerequisites

✅ Gemini API Key (free at https://makersuite.google.com/app/apikey)  
✅ Supabase project configured  
✅ POS application running

## Installation Steps

### 1. Run Database Migrations

```bash
cd /home/lr/work/Proyectos/recoom-pos

# Apply migrations
supabase db push

# Or manually via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Run each migration file:
#    - 20251125_create_reorder_suggestions.sql
#    - 20251125_create_sales_analysis_function.sql
```

### 2. Configure Gemini API Key

```bash
# Set the secret in Supabase
supabase secrets set GEMINI_API_KEY=AIza...yourkey

# Or via Supabase Dashboard:
# Project Settings > Edge Functions > Add Secret
```

### 3. Deploy Edge Function

```bash
# Deploy the smart reorder analyzer
supabase functions deploy smart-reorder-analyzer --project-ref gdkpwsgcqwvsxghvoqmu

# Verify deployment
supabase functions list
```

### 4. Test the Function

```bash
# Get your anon key
ANON_KEY="your_anon_key_here"

# Test the function
curl -X POST \
  "https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/smart-reorder-analyzer" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"store_id":"your_store_id"}'
```

## Scheduled Execution (Automated Daily Analysis)

### Option A: Supabase Cron (Recommended)

Create a Supabase Edge Function webhook cron job:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Database > Webhooks
3. Create new webhook:
   - **Name**: `daily-smart-reorder`
   - **Type**: `Edge Function`
   - **Function**: `smart-reorder-analyzer`
   - **Schedule**: `0 2 * * *` (Daily at 2 AM)
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`
   - **Body**: `{}`

### Option B: pg_cron (Advanced)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily analysis at 2 AM
SELECT cron.schedule(
  'smart-reorder-analysis',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/smart-reorder-analyzer',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Remove job (if needed)
SELECT cron.unschedule('smart-reorder-analysis');
```

### Option C: External Cron (e.g., GitHub Actions)

Create `.github/workflows/smart-reorder.yml`:

```yaml
name: Daily Smart Reorder Analysis

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  trigger-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: Call Smart Reorder Function
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL}}/functions/v1/smart-reorder-analyzer" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

## Usage

### Manual Trigger from Dashboard

1. Navigate to Dashboard (`/dashboard`)
2. Find "Reabastecimiento Inteligente" widget
3. Click "Analizar" or "Actualizar"
4. View suggestions organized by priority

### View All Suggestions

Navigate to `/inventory/reorden` (link appears when > 3 suggestions)

### Acting on Suggestions

- **Ordenar**: Mark as ordered to track
- **Descartar**: Dismiss if not needed
- Auto-expires after 7 days if not acted upon

## Configuration

### Adjust Analysis Frequency

Edit cron schedule:
- Every 6 hours: `0 */6 * * *`
- Twice daily: `0 2,14 * * *`
- Weekly: `0 2 * * 0`

### Customize Widget Display

In `dashboard/page.tsx`:

```typescript
<SmartReorderWidget 
  storeId={currentStoreId} 
  maxItems={5}  // Show top 5 items (default: 3)
/>
```

### Tune AI Parameters

In `smart-reorder-analyzer/index.ts`, adjust:

```typescript
generationConfig: {
  temperature: 0.2,  // Lower = more conservative (0.0-1.0)
  maxOutputTokens: 2000,
}
```

## Monitoring

### View Logs

```bash
# Check Edge Function logs
supabase functions logs smart-reorder-analyzer --follow

# View last 100 lines
supabase functions logs smart-reorder-analyzer -n 100
```

### Check Suggestions in Database

```sql
-- View all pending suggestions
SELECT 
  rs.*,
  p.name as product_name
FROM reorder_suggestions rs
JOIN products p ON rs.product_id = p.id
WHERE rs.status = 'pending'
ORDER BY rs.priority, rs.days_until_depletion;

-- Analytics
SELECT 
  priority,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM reorder_suggestions
WHERE status = 'pending'
GROUP BY priority;
```

## Troubleshooting

### No Suggestions Generated

1. Check sales data exists:
   ```sql
   SELECT COUNT(*) FROM sales WHERE sale_date >= NOW() - INTERVAL '30 days';
   ```

2. Verify products have inventory:
   ```sql
   SELECT COUNT(*) FROM inventory WHERE stock > 0;
   ```

3. Check Edge Function logs for errors

### Analysis Takes Too Long

- Limit products in `get_sales_analysis` function (currently 100)
- Reduce historical data range (currently 30 days)
- Process by store instead of all stores

### Gemini API Errors

- Verify API key is correct
- Check quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas  
- Try different model if needed (change in Edge Function)

## Cost Analysis

| Component | Cost |
|-----------|------|
| Gemini API (Free Tier) | $0/month |
| Supabase Database Storage | ~0.1 MB |
| Edge Function Executions | $0 (included) |
| **Total** | **$0/month** |

**Note**: Gemini free tier includes 60 requests/minute, more than enough for daily analysis.

## Next Steps

1. ✅ Test with real sales data
2. ✅ Adjust AI prompts based on results
3. ✅ Fine-tune priority thresholds
4. ✅ Add supplier integration (future)
5. ✅ Implement purchase order generation (future)
