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

## Step 5: Enable Google Auth (Detailed Guide)

To enable Google Sign-In for your app, follow these steps:

### A. Get your Redirect URI from Supabase
1. In your **Supabase Dashboard**, navigate to **Authentication → Providers → Google**.
2. Find the **Callback URL (redirect URI)** at the bottom of the Google configuration section. Copy this; you'll need it for Google Cloud.

### B. Setup Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project** (or select an existing one).
3. Navigate to **APIs & Services → OAuth consent screen**.
    - Choose **External**.
    - Fill in the required App Information (App name, User support email, Developer contact info).
    - Save and continue through the scopes (default scopes are fine).
4. Navigate to **APIs & Services → Credentials**.
    - Click **+ Create Credentials** → **OAuth client ID**.
    - Select **Web application** as the Application type (even for mobile apps, Supabase acts as the web handler).
    - Under **Authorized redirect URIs**, click **+ ADD URI** and paste the **Callback URL** you copied from Supabase.
    - Click **Create**.
5. Copy the generated **Client ID** and **Client Secret**.

### C. Configure Supabase
1. Go back to your **Supabase Dashboard → Authentication → Providers → Google**.
2. Enter your **Client ID** and **Client Secret**.
3. Toggle "Enable Google" to **ON**.
4. Click **Save**.

### D. Handling Redirects in Expo (Critical)
For Google Auth to return to your app after login:
1. Ensure your `app.json` has a scheme (e.g., `"scheme": "spenda"`).
2. Use the following code pattern for signing in:
   ```typescript
   import * as Linking from 'expo-linking';

   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: Linking.createURL('auth-callback')
     }
   });
   ```


---

## Step 6: Run the App

```bash
cd Spenda
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.
