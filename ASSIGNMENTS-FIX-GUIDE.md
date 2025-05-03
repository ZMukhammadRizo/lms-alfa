# Quick Guide to Fix Assignment Data Issues

If you're seeing errors like these:
```
GET https://hbwugavucnvpcerpwkcb.supabase.co/rest/v1/assignments?select=*&order=due_date.asc 400 (Bad Request)

Error fetching assignments: {code: '42703', details: null, hint: 'Perhaps you meant to reference the column "assignments.duedate".', message: 'column assignments.due_date does not exist'}
```

Follow these steps to fix them:

## 1. Run the Fix Script

1. Open your Supabase Dashboard and go to the SQL Editor
2. Copy the entire contents of `frontend/sql/fix-assignments-table.sql`
3. Paste it into the SQL Editor and click "Run"
4. This will automatically fix column name mismatches and add missing columns

## 2. Add Some Sample Data

After running the fix script, add sample data by running:

```sql
-- Replace with your actual user ID from the browser console or auth table
SELECT insert_sample_assignments('your-user-uuid-here');
```

## 3. Reload the Application

Refresh your browser to see the assignments data now properly loaded from Supabase.

## What the Fix Handles:

1. **Column Name Mismatch**: The code expects `duedate` (without underscore) but some database setups might have created `due_date` (with underscore)
2. **Missing Columns**: Adds any required columns that might be missing
3. **Row Level Security**: Ensures the proper RLS policies are in place 
4. **Fallback Data**: If issues persist, the application will still function with mock data

## Still Having Trouble?

Try the complete setup option described in `README-assignments.md` to recreate the entire table from scratch. 