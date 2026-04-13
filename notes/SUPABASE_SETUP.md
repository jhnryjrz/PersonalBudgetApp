# BudgetWise — Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"** and fill in the details.
3. Wait until the project is ready (a few minutes).

---

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

---

## Step 3: Add Keys to the App

Open the file `lib/supabase.ts` and replace the placeholder values:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';     // ← paste your Project URL here
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // ← paste your Anon Key here
```

---

## Step 4: Run the Database Schema

1. In your Supabase project, go to **SQL Editor**.
2. Click **"New Query"**.
3. Copy the entire contents of `notes/supabase_schema.sql` (in this project folder).
4. Paste it into the editor and click **"Run"**.

This creates all the required tables:
- `profiles` — stores user names
- `budgets` — stores budget entries
- `expenses` — stores expense transactions
- `spending_limits` — stores daily/weekly limits

---

## Step 5: Enable Google Auth (Optional)

If you want Google login:

1. In Supabase dashboard, go to **Authentication → Providers**.
2. Enable **Google**.
3. Follow the instructions to create a Google OAuth app in the [Google Cloud Console](https://console.cloud.google.com/).
4. Add the Client ID and Secret to Supabase.

> **Note:** For Expo Go / development, Google OAuth requires deep linking setup.
> For a simpler setup, **email/password auth** works out of the box.

---

## Step 6: Run the App

```bash
cd myApp
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.
