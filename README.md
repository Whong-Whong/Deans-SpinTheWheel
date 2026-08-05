# deans-spin-the-wheel

A playful prize wheel experience built with Vite and a small Node/MongoDB backend.

## Deploying on Vercel

This project now deploys on Vercel as:

- a static Vite frontend from `dist`
- serverless API routes from `api/*`

Set these project environment variables in Vercel before deploying:

```bash
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="SpinTheWheel"
MONGODB_COLLECTION="spin_the_wheel_entries"
MONGODB_ENTRIES_COLLECTION="spin_the_wheel_config"
EXPORT_ADMIN_EMAIL="katapills@gmail.com"
EXPORT_ACCESS_KEY="your-access-key"
```

Vercel should use:

```bash
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## MongoDB setup

Registrations are now stored in your existing MongoDB database `SpinTheWheel` inside the collection `spin_the_wheel_entries` by default.

Set the connection string before running the app:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017"
```

If you want to use a different database or collection, also set:

```bash
MONGODB_DB="SpinTheWheel"
MONGODB_COLLECTION="spin_the_wheel_entries"
```

Then start the app:

```bash
npm run dev
```

## Downloading Excel exports

Use the **Download registrations** block in the app:
1. Click the **Admin Access** button (top-right) — no player registration needed.
2. Login with admin email (`katapills@gmail.com`) and your export access key.
3. After login, the date-range download panel appears.
4. Pick a **From** date.
5. Pick a **To** date.
6. Click **Download Excel**.

## Managing wheel entries in Admin

In the same **Admin Access** modal, admins can:
1. Add a new wheel entry label.
2. Remove existing wheel entries (one at a time, including duplicates).

These changes are saved in MongoDB and applied to the live wheel without code edits.

The file includes all registrations in that date range.

Set these environment variables for access control:

```bash
EXPORT_ADMIN_EMAIL="katapills@gmail.com"
EXPORT_ACCESS_KEY="Admin2468!"
```
