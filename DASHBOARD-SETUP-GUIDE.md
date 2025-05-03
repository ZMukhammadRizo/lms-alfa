# Dashboard Setup Guide

## Problem: Dashboard Data Not Loading

The dashboard is currently showing mock data but not connecting to the real database. This guide will help you set up the required tables and data in your Supabase database.

## Step 1: Access the Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com) and log in to your account
2. Select your project (URL shown in console: `https://hbwugavucnvpcerpwkcb.supabase.co`)
3. In the left sidebar, click on **SQL Editor**

## Step 2: Create Required Tables

1. Copy the entire contents of `frontend/sql/initialize-dashboard.sql`
2. Paste it into the SQL Editor
3. Look for this line at the bottom and make sure it has your user ID:
   ```sql
   -- SELECT insert_sample_dashboard_data('1eb67259-6461-4b59-ad9e-8db82f3adf94'); -- Replace with your actual user ID
   ```
4. Remove the comment `--` from the beginning of this line to execute the sample data function
5. Click the **Run** button to execute the SQL

## Step 3: Verify Table Creation

After running the SQL, verify that the tables were created:

1. Go to the **Table Editor** in the Supabase dashboard
2. You should see new tables: `assignments`, `grades`, `student_courses`, and `lessons`
3. Click on each table to verify they contain the sample data

## Step 4: Refresh Your Application

1. Return to your LMS application
2. Refresh the page
3. The dashboard should now show real data from the database instead of mock data

## Troubleshooting

If you still see errors or mock data:

1. Check the console errors to identify specific issues
2. Verify the user ID in the SQL matches your authenticated user's ID
3. Make sure the table columns match what's expected in `dashboardService.ts`
4. Try the following query to manually insert data for your user:

```sql
SELECT insert_sample_dashboard_data('1eb67259-6461-4b59-ad9e-8db82f3adf94');
```

## Next Steps

Once your dashboard is connected to real data, you can:

1. Add more sample data through the Supabase Table Editor
2. Modify the dashboard service to add more features
3. Create additional visualizations with the real data 