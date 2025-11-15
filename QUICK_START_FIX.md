# ⚡ Quick Start - Fix Database Issue

## 🚨 The Problem
Your Mindous.ai database is **NOT working** because:
1. Supabase API key is truncated (incomplete)
2. Supabase project may be paused
3. Database migrations haven't been applied

## ✅ The Fix (3 Simple Steps)

### Step 1: Unpause Your Supabase Project (if needed)
1. Go to https://supabase.com/dashboard
2. Login with GitHub: **seanjtuckercm**
3. Find project: `ktorvduzhojsvakixvcr`
4. If you see "Resume" or "Restore" button → Click it
5. Wait 2-3 minutes for project to activate

### Step 2: Get Your Credentials
In Supabase Dashboard:
- **Settings → API** → Copy these:
  - Project URL
  - anon/public key (FULL JWT token - don't truncate!)
  - service_role key (FULL JWT token)
  
- **Settings → Database** → Copy:
  - Connection String (URI format)

### Step 3: Run the Fix
```bash
cd /home/ubuntu/mindous

# Update credentials interactively
./update-supabase-credentials.sh

# Apply fix and verify
./fix-database.sh
```

## ✨ What Happens
The scripts will:
- ✅ Update your .env.local with correct credentials
- ✅ Test database connection
- ✅ Apply all migrations
- ✅ Create all 7 required tables
- ✅ Verify everything works

## 🎯 Result
**Database will be permanently fixed** - no more connection errors!

## 📚 More Details
- Full diagnosis: `DATABASE_DIAGNOSIS_REPORT.md`
- Detailed guide: `SUPABASE_FIX_GUIDE.md`

## 💬 Need Help?
Just let me know:
1. Can you access Supabase dashboard?
2. Is the project paused or active?

I'll guide you through the fix!
