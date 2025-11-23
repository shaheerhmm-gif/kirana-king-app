# 📖 The Ultimate "No-Brainer" Deployment Guide for KiranaKing

**STOP! READ THIS FIRST:**
This guide assumes you have **never** done this before.
Do not skip a single line.
Do not "guess".
If a step says "Click the green button", look for the green button.

---

## ✅ Phase 0: The Setup (Do this ONCE)

### Step 1: Install "GitHub Desktop" (The Magic Tool)
We will use a visual tool so you don't have to type code commands.

1.  Go to [desktop.github.com](https://desktop.github.com).
2.  Click the big purple button **Download for Windows**.
3.  Open the file you downloaded (`GitHubDesktopSetup.exe`).
4.  It will install and open automatically.
5.  **Sign In:**
    *   Click **Sign in to GitHub.com**.
    *   It will open your browser. Click **Authorize desktop**.
    *   Go back to the app. It should say "Welcome".
    *   Click **Finish**.

### Step 2: Create Your Free Accounts
Open these 3 links in new tabs and sign up. Write down your passwords!
1.  **Supabase:** [supabase.com](https://supabase.com) -> This holds your data. (Sign in with GitHub).
2.  **Render:** [render.com](https://render.com) -> This runs your backend. (Sign in with GitHub).
3.  **Vercel:** [vercel.com](https://vercel.com) -> This runs your frontend. (Sign in with GitHub).

---

## ☁️ Phase 1: Uploading Your Code (Using GitHub Desktop)

### Step 1: Put your code in the tool
1.  Open **GitHub Desktop**.
2.  Look at the top-left menu. Click **File** -> **Add local repository...**
3.  A box appears. Click **Choose...**
4.  Navigate to your project folder: `Desktop` -> `Kirana King 2`.
5.  Click **Select Folder**.
6.  Click the blue button **Add Repository**.
    *   *Note:* If it asks "This directory does not appear to be a Git repository. Would you like to create one here?", click **Create a repository**. Then click **Create Repository** again.

### Step 2: Publish it to the Internet
1.  Look at the top bar of the app. Click the button **Publish repository**.
2.  **Name:** `kirana-king-app`
3.  **Description:** Leave empty.
4.  **Keep this code private:** ⚠️ **UNCHECK THIS BOX.** (Make sure it is empty/white). We want it Public so the free servers can see it easily.
5.  Click **Publish Repository**.
6.  **Wait.** The loading bar will finish.
7.  **Success Check:** Click the button **View on GitHub** (it appears after publishing). If you see your files in the browser, you are done with Phase 1!

---

## 🗄️ Phase 2: The Database (Where data lives)

1.  Go to [supabase.com/dashboard](https://supabase.com/dashboard).
2.  Click the green button **New Project**.
3.  **Organization:** Choose your name.
4.  **Name:** Type `KiranaDB`.
5.  **Database Password:**
    *   Click **"Generate a password"**.
    *   **STOP!** Highlight this password. Copy it.
    *   Open "Notepad" on your computer. Paste the password.
    *   Type "DB PASSWORD" above it so you don't forget.
6.  **Region:** Choose **Mumbai** (or Singapore).
7.  Click **Create new project**.
8.  **Wait.** You will see a green bar loading. It says "Setting up project". This takes 2-3 minutes. Go drink water.
9.  **Once it finishes:**
    *   Look at the **Left Sidebar** (the dark grey strip on the left).
    *   Click the **Gear Icon ⚙️** at the very bottom (Project Settings).
    *   Click **Database** in the menu that appears.
10. Scroll down until you see **Connection String**.
11. Click the tab that says **URI**. (It is next to "Node.js").
12. Copy the long text inside the box. It starts with `postgresql://`.
13. Paste this into your Notepad.
14. **The Surgery:**
    *   Look at the text in Notepad. Find `[YOUR-PASSWORD]`.
    *   Delete `[YOUR-PASSWORD]`.
    *   Paste your actual password (from Step 5) there.
    *   **Make sure there are no spaces!**
15. This long string is your **Final Database URL**.

---

## 🧠 Phase 3: The Backend (The Brain)

1.  Go to [dashboard.render.com](https://dashboard.render.com).
2.  Click **New +** (top right corner). Select **Web Service**.
3.  Click **Next** under "Build and deploy from a Git repository".
4.  You will see `kirana-king-app`. Click the blue **Connect** button next to it.
5.  **Copy-Paste these settings exactly:**
    *   **Name:** `kirana-backend`
    *   **Region:** `Singapore`
    *   **Branch:** `main`
    *   **Root Directory:** `server` (Type `server` in the box. Do not leave empty).
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`
    *   **Instance Type:** Click **Free**.
6.  Scroll down to **Environment Variables**.
7.  Click **Add Environment Variable**.
    *   **Key:** `DATABASE_URL`
    *   **Value:** Paste your **Final Database URL** (the long one from Notepad).
8.  Click **Add Environment Variable** again.
    *   **Key:** `JWT_SECRET`
    *   **Value:** `secret123`
9.  Click **Create Web Service**.
10. **Wait.** You will see a lot of text scrolling. This takes 5 minutes.
11. Look for a green checkmark ✅ or the word **Live**.
12. Look at the top-left corner. You will see a URL like `https://kirana-backend.onrender.com`.
13. **Copy this URL.** Paste it in Notepad. Label it "BACKEND URL".

---

## 🔌 Phase 4: Connecting the Wires

We need to tell your database to create the tables.

1.  Go to your computer folder `Kirana King 2`.
2.  Open the folder `server`.
3.  Find the file named `.env`. Right-click -> Open with Notepad.
4.  Delete everything inside.
5.  Paste this: `DATABASE_URL="PASTE_YOUR_FINAL_DATABASE_URL_HERE"`
6.  Replace the text with your actual URL from Notepad.
7.  Save (Ctrl+S) and Close.
8.  Open **GitHub Desktop**.
9.  Click **Repository** (top menu) -> **Open in Command Prompt** (or Terminal).
10. A black window opens. Type: `cd server` and press Enter.
11. Type: `npx prisma db push` and press Enter.
12. **Success Check:** It should say "🚀 Your database is now in sync".

---

## 🎨 Phase 5: The Frontend (The App)

1.  Go to [vercel.com/new](https://vercel.com/new).
2.  You will see `kirana-king-app`. Click **Import**.
3.  **Project Name:** Leave it.
4.  **Framework Preset:** `Vite` (It should be automatic).
5.  **Root Directory:**
    *   Click **Edit**.
    *   Select the folder `client`.
    *   Click **Continue**.
6.  **Environment Variables:**
    *   Click to expand.
    *   **Key:** `VITE_API_URL`
    *   **Value:** Paste your **BACKEND URL** from Notepad.
    *   **CRITICAL STEP:** Add `/api` to the end of the URL.
        *   *Example:* `https://kirana-backend.onrender.com/api`
7.  Click **Deploy**.
8.  Wait 1 minute. You will see confetti 🎉.
9.  Click **Continue to Dashboard**.
10. Click **Visit**.
11. **This is it!** Copy the URL from the browser bar. This is your App Link.

---

## 📱 Phase 6: Delivery

1.  WhatsApp the **App Link** to the store owner.
2.  Tell them:
    *   "Click this link."
    *   "Tap the 3 dots (Android) or Share button (iPhone)."
    *   "Tap **Add to Home Screen**."
3.  Done!

---

## 🆘 Panic Button (Troubleshooting)

*   **"It says 'Server Error' when I log in!"**
    *   Did you add `/api` to the end of the URL in Phase 5?
    *   Did you run `npx prisma db push` in Phase 4?
*   **"The app is white/blank!"**
    *   Refresh the page.
    *   Wait 1 minute (The free server might be sleeping).
