# GLOBAL EXECUTION CONTRACT v2.0

---

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

## ✅ VERIFIED STATE (Auto-Updated After Testing)
*Only milestones confirmed through user testing/verification are recorded here*

### Project: Mindous.ai
**Directory:** `/home/ubuntu/mindous/`  
**GitHub:** `seantuckercm/mindous`  
**Last Updated:** Saturday, November 15, 2025

---

### ✅ INFRASTRUCTURE (Verified)

#### Git Repository
- ✅ Repository initialized and connected to `seantuckercm/mindous`
- ✅ Initial commit pushed successfully
- ✅ Remote origin configured

#### Dependencies
- ✅ Node.js packages installed (845 packages via `npm install`)
- ✅ No blocking errors in installation

#### Environment Configuration
- ✅ `.env.local` created and configured with:
  - Supabase credentials (URL, anon key, service role key, database URL)
  - Clerk credentials (publishable key, secret key)
  - OpenAI API key (pending verification)
  - Anthropic API key (pending verification)
  - Google AI API key (pending verification)

#### Tech Stack Confirmed
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- ShadCN UI components
- Drizzle ORM
- Supabase Postgres
- Clerk Auth
- Vercel deployment target

---

### ⚠️ DATABASE (Partially Complete)

#### Schema Defined
- ✅ Schema file exists at `/home/ubuntu/mindous/db/schema.ts`
- ✅ Migration file exists at `/home/ubuntu/mindous/db/migrations/0000_odd_mongoose.sql`

#### Migration Status
- ❌ Migration NOT yet applied to Supabase database
- ❌ Database connection NOT yet tested
- ⚠️ **BLOCKER:** Supabase project mismatch (code references `ktorvduzhojsvakixvcr`, actual project under `seanjtuckercm` GitHub account)

---

### ⏳ APPLICATION STATUS (In Progress)

#### Development Server
- ✅ Server starts successfully
- ⚠️ Application loads but shows sales/landing page (not functional app)
- ❌ End-to-end functionality NOT yet verified

#### Authentication (Clerk)
- ⏳ Configured but not tested
- ❌ Sign-in flow not verified
- ❌ User session management not verified

#### LLM Integration
- ⏳ API keys added to `.env.local`
- ❌ OpenAI integration not tested
- ❌ Anthropic integration not tested
- ❌ Google AI integration not tested
- ❌ Multi-LLM routing not implemented

---

### 🚫 FEATURES (Not Yet Implemented)

#### Core Features (From PRDs)
- ❌ **F1:** User Authentication & Onboarding
- ❌ **F2:** Task Input & Decomposition
- ❌ **F3:** Multi-LLM Routing & Execution
- ❌ **F4:** Real-time Progress Tracking
- ❌ **F5:** Result Aggregation & Display
- ❌ **F6:** Task History & Management
- ❌ **F7:** Admin Dashboard & Analytics

---

## 📋 CORE EXECUTION RULES (Immutable)

These rules are **non-negotiable** and must be followed for every task:

1. **READ THE ENTIRE MESSAGE FIRST** - Before taking any action, read the complete instruction
2. **RESTATE THE TASK** - Confirm understanding by restating what you're about to do
3. **ONE FEATURE AT A TIME** - Never combine multiple features in a single implementation
4. **TEST IMMEDIATELY** - After each feature, open browser and verify it works (not just "code looks good")
5. **COMMIT AFTER TESTING** - Only commit to Git after user confirms feature works
6. **MEMORY ANCHORS** - After each feature, restate what was done as a memory anchor
7. **NO ASSUMPTIONS** - If unclear, ask before proceeding
8. **SMALL SHIPPABLE SLICES** - Break work into the smallest testable increments
9. **VERIFY, DON'T ASSUME** - Check actual state (files, env vars, database) before acting
10. **EXECUTION DISCIPLINE** - Follow the plan, don't improvise or skip steps

---

## 🔄 EXECUTION WORKFLOW

### For Each New Feature:
1. **Read** the complete instruction
2. **Restate** what you're about to implement
3. **Implement** the smallest testable slice
4. **Test** in browser immediately (user verifies)
5. **Commit** to Git after user confirms it works
6. **Update** this contract's VERIFIED STATE section
7. **Memory Anchor** - Restate what was accomplished

### For Debugging/Fixes:
1. **Verify** the actual current state (don't assume)
2. **Identify** the specific issue
3. **Fix** one thing at a time
4. **Test** to confirm fix works
5. **Update** KNOWN ISSUES section when resolved

---

## 📖 USAGE INSTRUCTIONS

### For the AI Assistant:
- **Before starting any task:** Review NEXT EXECUTION FOCUS and VERIFIED STATE
- **Check KNOWN ISSUES:** Don't waste time on already-identified blockers
- **Update after verification:** When user confirms something works, note it for next update
- **Stay focused:** Reference NEXT EXECUTION FOCUS to avoid scope creep

### For the User:
- **After each verified milestone:** Confirm "Verified, works" or "Tested, good"
- **Paste the updated contract** in your next prompt (see highlighted section below)
- **Update NEXT EXECUTION FOCUS** when priorities change

---

## 📝 VERSION HISTORY

- **v2.0** (Nov 15, 2025) - Restructured with Next Execution Focus at top, added state tracking
- **v1.0** (Nov 2025) - Initial core execution rules established

---

**END OF CONTRACT**

*This is a living document. The NEXT EXECUTION FOCUS and VERIFIED STATE sections update as the project progresses.*
