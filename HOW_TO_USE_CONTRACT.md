# 📋 How to Use the Execution Contract

## What to Paste in Each Prompt

Copy everything in the **YELLOW HIGHLIGHTED** section below and paste it at the beginning of your next prompt to the AI:

---

<div style="background-color: #ffff99; padding: 20px; border: 3px solid #ffcc00;">

## 🎯 NEXT EXECUTION FOCUS

**Current Priority:** Fix database connection and verify basic app functionality

### Immediate Actions Required:
1. **Apply database migration** to Supabase (execute `0000_odd_mongoose.sql` in SQL Editor)
2. **Verify database connection** by testing app loads without errors
3. **Test LLM API keys** by making a simple API call to each provider
4. **Verify authentication flow** by signing in through Clerk

### Success Criteria:
- App loads and shows functional interface (not sales page)
- No database connection errors in console
- User can sign in via Clerk
- At least one LLM provider responds successfully

---

## 🚨 KNOWN ISSUES & BLOCKERS

### 🔴 Critical
1. **Database Migration Pending** - Schema not applied, app cannot function without database
2. **Supabase Project Mismatch** - Code references wrong project ID
3. **LLM APIs Untested** - Cannot verify end-to-end task execution

### 🟡 Important
1. **Supabase Anon Key Verification** - Key may be truncated (needs verification)
2. **Development Server Shows Sales Page** - Expected to see functional app interface

---

## ✅ VERIFIED STATE

### Project: Mindous.ai
**Directory:** `/home/ubuntu/mindous/`  
**GitHub:** `seantuckercm/mindous`  
**Last Updated:** Saturday, November 15, 2025

### ✅ INFRASTRUCTURE (Verified)
- ✅ Git: Connected to `seantuckercm/mindous`, initial commit pushed
- ✅ Dependencies: 845 packages installed via `npm install`
- ✅ Environment: `.env.local` configured with Supabase, Clerk, and 3 LLM API keys

### ⚠️ DATABASE (Partially Complete)
- ✅ Schema defined in `/home/ubuntu/mindous/db/schema.ts`
- ❌ Migration NOT applied to Supabase
- ❌ Database connection NOT tested

### ⏳ APPLICATION STATUS (In Progress)
- ✅ Dev server starts successfully
- ⚠️ Shows sales page (not functional app)
- ❌ Auth flow not verified
- ❌ LLM integrations not tested

### 🚫 FEATURES (Not Yet Implemented)
- ❌ F1: User Authentication & Onboarding
- ❌ F2: Task Input & Decomposition
- ❌ F3: Multi-LLM Routing & Execution
- ❌ F4: Real-time Progress Tracking
- ❌ F5: Result Aggregation & Display
- ❌ F6: Task History & Management
- ❌ F7: Admin Dashboard & Analytics

---

## 📋 CORE EXECUTION RULES

1. **READ THE ENTIRE MESSAGE FIRST** - Before taking any action
2. **RESTATE THE TASK** - Confirm understanding
3. **ONE FEATURE AT A TIME** - Never combine features
4. **TEST IMMEDIATELY** - Open browser and verify (not just "code looks good")
5. **COMMIT AFTER TESTING** - Only after user confirms it works
6. **MEMORY ANCHORS** - Restate what was done after each feature
7. **NO ASSUMPTIONS** - Ask if unclear
8. **SMALL SHIPPABLE SLICES** - Smallest testable increments
9. **VERIFY, DON'T ASSUME** - Check actual state before acting
10. **EXECUTION DISCIPLINE** - Follow the plan, don't improvise

</div>

---

## 📝 After Each Session

1. **When AI completes a task**, it will provide an updated version of the sections above
2. **You verify** by testing in the browser
3. **You confirm** with "Verified, works" or "Tested, good"
4. **Copy the updated yellow section** from the AI's response
5. **Paste it in your next prompt** to maintain context

---

## 🎯 Why This Works

- **NEXT EXECUTION FOCUS** = AI knows exactly what to do next (no loops)
- **KNOWN ISSUES** = AI doesn't waste time on already-identified problems
- **VERIFIED STATE** = AI doesn't redo completed work
- **CORE RULES** = AI maintains execution discipline

---

## 💡 Example Usage

**Your Next Prompt:**
```
[Paste the yellow highlighted section here]

Now execute the next task: Apply the database migration to Supabase.
```

The AI will:
1. Check VERIFIED STATE (see what's already done)
2. Check KNOWN ISSUES (avoid wasting time)
3. Read NEXT EXECUTION FOCUS (know what to do)
4. Follow CORE RULES (execute properly)
5. Update the sections after you verify

---

**That's it! The contract grows with your project and prevents redundancy.**
