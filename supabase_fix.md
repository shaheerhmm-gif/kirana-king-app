# How to Fix Your Supabase Connection (Step-by-Step)

It seems like your Render server is connecting to a **different database** than the one you are looking at. Follow these steps to sync them up.

## Step 1: Get the Correct Connection URL from Supabase

1.  Log in to your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2.  Click on your **Project** (the one where you ran the SQL script).
3.  In the left sidebar, click on the **Settings** icon (cogwheel) -> **Database**.
4.  Scroll down to the **Connection String** section.
5.  Click on the **URI** tab.
6.  **IMPORTANT:** Uncheck "Use connection pooling" (or check it, but we need the **Transaction Mode**).
    *   Actually, for Render, we **NEED** the Transaction Pooler (Port 6543).
    *   Look for the dropdown that says "Mode: Session" and change it to **"Mode: Transaction"**.
    *   Ensure the port in the URL is **6543**.
7.  **Copy the entire URL.**
    *   It will look like: `postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
    *   *Note: You will need to replace `[YOUR-PASSWORD]` with your actual database password.*

## Step 2: Update Render Environment Variables

1.  Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2.  Click on your **Web Service**.
3.  Click on **Environment** (left sidebar).
4.  Find `DATABASE_URL`.
5.  **Edit** it and paste the **NEW URL** you just copied from Supabase.
    *   **Make sure to type in your real password** where the placeholder was!
6.  Click **"Save Changes"**.

## Step 3: Update Local Environment (Optional but Recommended)

1.  Open your project in VS Code.
2.  Open the file `server/.env`.
3.  Replace the `DATABASE_URL` there with the same new URL.
4.  Save the file.

## Step 4: Verify the Fix

1.  Wait for Render to redeploy (it usually restarts automatically when you change Env Vars).
2.  Once it's live, try to **Register** again on your website.

---

### If it STILL fails...

If you updated the URL and it still says "Table does not exist", it means the tables aren't in *that* database.

1.  Go back to **Supabase Dashboard** -> **SQL Editor**.
2.  Paste the code from `db_setup.sql` again.
3.  Run it.
4.  Now try Registering again.
