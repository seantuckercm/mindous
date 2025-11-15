# MINDOUS.AI EXECUTION CONTRACT - CURRENT STATE

**Last Updated:** Saturday, November 15, 2025  
**Project Directory:** `/home/ubuntu/mindous/`  
**GitHub Repository:** `seantuckercm/mindous`

---

## 🎯 NEXT EXECUTION PROMPT

**Current Priority:** Apply database migration and test Feature 1 (P0) components

### Immediate Actions Required:

1. **Apply Database Migration**
   - Navigate to Supabase SQL Editor
   - Execute `/home/ubuntu/mindous/db/migrations/0000_odd_mongoose.sql`
   - Verify tables are created successfully

2. **Integrate Feature 1 (P0) Components into Main App**
   - Import and add `TaskCard`, `StatusBar`, `RunProgressPanel` to main dashboard page
   - Create a test page/route to display these components
   - Ensure all components render without errors

3. **Test in Browser**
   - Run development server (`npm run dev`)
   - Open in browser and verify components display correctly
   - Check console for any errors

4. **Create Backend API Endpoints (if time permits)**
   - `/api/runs/create` - Create new task execution run
   - `/api/runs/[id]/status` - Get run status
   - Implement basic CRUD operations for runs table

### Success Criteria:
- ✅ Database migration applied, tables exist in Supabase
- ✅ Feature 1 components render in browser without errors
- ✅ No TypeScript/React errors in console
- ✅ Components are functional (interactive where applicable)

---

## 🧠 VERIFIED ACCOMPLISHMENTS & CONTEXT
**⚠️ COPY THIS SECTION INTO FUTURE PROMPTS TO PREVENT REDUNDANCY**

### ✅ DO NOT QUESTION OR CHANGE THESE:

1. **`.env.local` Configuration is WORKING**
   - Supabase project ID: `ktorvduzhojsvakixvcr`
   - Supabase URL: `https://ktorvduzhojsvakixvcr.supabase.co`
   - All API keys are configured correctly
   - **DO NOT ask to verify/change these unless explicitly requested**

2. **Project Structure is ESTABLISHED**
   - Main directory: `/home/ubuntu/mindous/`
   - Components: `/home/ubuntu/mindous/src/components/`
   - Database schema: `/home/ubuntu/mindous/db/schema.ts`
   - Migration file: `/home/ubuntu/mindous/db/migrations/0000_odd_mongoose.sql`

3. **Dependencies are INSTALLED**
   - 845 packages installed successfully
   - No need to run `npm install` unless new packages are added

4. **Git Repository is CONNECTED**
   - Remote: `seantuckercm/mindous`
   - Initial commits pushed
   - **DO NOT reinitialize git**

5. **PRDs are UPDATED**
   - All PRD files in `/home/ubuntu/mindous/docs/PRD/` include Abacus.AI findings
   - **DO NOT regenerate or re-update PRDs unless explicitly asked**

6. **Feature 1 (P0) Components are CREATED**
   - `task-card.tsx` ✅
   - `status-bar.tsx` ✅
   - `run-progress-panel.tsx` ✅
   - Location: `/home/ubuntu/mindous/src/components/runs/`
   - **DO NOT recreate these components unless fixing bugs**

### ❌ NOT YET DONE (These ARE needed):

1. **Database Migration NOT Applied**
   - SQL file exists but not executed in Supabase
   - Tables do not exist in database yet

2. **Components NOT Integrated**
   - Created components are not yet imported/used in any pages
   - No test page exists to view them

3. **Backend API NOT Implemented**
   - No API routes created yet
   - No CRUD operations for runs, tasks, agents, etc.

4. **Components NOT Browser-Tested**
   - Visual appearance not verified
   - Interactive functionality not tested

---

## 📋 CORE EXECUTION RULES (IMMUTABLE)

**These 16 rules are NON-NEGOTIABLE for every task:**

1. **READ THE ENTIRE MESSAGE FIRST** - Before taking any action, read the complete instruction
2. **RESTATE THE TASK** - Confirm understanding by restating what you're about to do
3. **DO EXACTLY WHAT'S ASKED, NO ADDITIONS** - Don't add features or improvements not requested
4. **STAY INSIDE THE PRD** - Don't invent features; reference the PRDs for requirements
5. **NEVER EXPLORE/VERIFY UNLESS ASKED** - Trust the verified state unless explicitly told to check
6. **ASSUME MEMORY IS WEAK** - Each session is fresh; rely on this contract for context
7. **EVERY ACTION COSTS CREDITS, BE SURGICAL** - Minimize unnecessary operations and file reads
8. **DESKTOP FIRST** - Design and build for desktop experience (mobile later)
9. **PERMISSION TO ACCESS/CREATE ANYTHING** - You have full access to create/modify files and resources
10. **OPEN IN BROWSER AFTER EACH FEATURE** - Test immediately after implementation (or instruct user to)
11. **RESTATE WHAT WAS DONE AS MEMORY ANCHOR** - After completing a task, summarize what was accomplished
12. **STOP WHEN DONE** - Don't continue beyond the requested task
13. **GENERATE NEXT_EXECUTION_PROMPT** - After completing work, provide clear next steps
14. **ALL UI ELEMENTS MUST BE FUNCTIONAL** - No placeholder buttons or non-working features
15. **IF ALREADY DONE, STOP AND INFORM** - Check verified state; don't redo completed work
16. **NAVIGATE TO WEBSITES WHEN NEEDED** - For API keys, setup, or verification that requires web access

---

## 📊 CURRENT PROJECT STATE

### Infrastructure & Setup
| Component | Status | Notes |
|-----------|--------|-------|
| Git Repository | ✅ Connected | `seantuckercm/mindous` |
| Node Modules | ✅ Installed | 845 packages |
| Environment Variables | ✅ Configured | `.env.local` with all keys |
| Database Schema | ✅ Defined | `db/schema.ts` |
| Database Migration | ⏳ Created | Not yet applied to Supabase |
| Supabase Project | ✅ Connected | `ktorvduzhojsvakixvcr` |
| Clerk Auth | ✅ Configured | Keys in `.env.local` |

### Features & Components
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Feature 1 (P0):** Task Execution Visualization | ⏳ In Progress | `/src/components/runs/` | Components created, not integrated |
| - TaskCard | ✅ Created | `task-card.tsx` | Needs integration & testing |
| - StatusBar | ✅ Created | `status-bar.tsx` | Needs integration & testing |
| - RunProgressPanel | ✅ Created | `run-progress-panel.tsx` | Needs integration & testing |
| **Feature 2:** Task Input | ❌ Not Started | - | Planned |
| **Feature 3:** Multi-LLM Routing | ❌ Not Started | - | Planned |
| **Feature 4:** Real-time Streaming | ❌ Not Started | - | Planned |

### Backend & API
| Endpoint/Service | Status | Notes |
|------------------|--------|-------|
| `/api/runs` | ❌ Not Created | CRUD operations needed |
| `/api/tasks` | ❌ Not Created | Planned |
| `/api/agents` | ❌ Not Created | Planned |
| `/api/executions` | ❌ Not Created | Planned |
| Database Connection | ⏳ Configured | Not yet tested |
| Drizzle ORM Setup | ✅ Configured | Ready to use |

### Documentation
| Document | Status | Location |
|----------|--------|----------|
| PRDs (7 files) | ✅ Updated | `/docs/PRD/` |
| Case Studies (16 files) | ✅ Available | `/home/ubuntu/Uploads/` |
| Execution Contract | ✅ Current | This file |
| README | ⏳ Needs Update | Project root |

---

## 🚨 KNOWN ISSUES & BLOCKERS

### 🔴 Critical
- **Database Migration Pending** - Schema not yet applied to Supabase (blocks all database operations)
- **Components Not Integrated** - Created components not yet visible in app

### 🟡 Important
- **No API Endpoints** - Backend logic not yet implemented
- **No Browser Testing** - Visual appearance and functionality not verified
- **Development Server Shows Wrong Page** - May show sales/landing page instead of functional app interface

### 🟢 Low Priority
- **README Outdated** - Needs update with current project state
- **No Test Suite** - Unit/integration tests not yet set up

---

## 🛠️ TECH STACK REFERENCE

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI
- **State Management:** React Context + Hooks

### Backend
- **Database:** Supabase Postgres
- **ORM:** Drizzle ORM
- **Authentication:** Clerk
- **API:** Next.js API Routes (App Router)

### AI/LLM Integration
- **OpenAI:** GPT-4, GPT-4 Turbo
- **Anthropic:** Claude 3.5 Sonnet
- **Google:** Gemini Pro
- **Multi-LLM Routing:** Custom implementation (planned)

### Deployment
- **Platform:** Vercel
- **Database Hosting:** Supabase Cloud
- **Auth Hosting:** Clerk Cloud

---

## 🔄 EXECUTION WORKFLOW

### For Each New Feature:
1. **Read** the complete instruction
2. **Check** "Verified Accomplishments" section - don't redo completed work
3. **Restate** what you're about to implement
4. **Implement** the smallest testable slice
5. **Test** in browser immediately
6. **Commit** to Git after verification
7. **Update** this contract's state sections
8. **Memory Anchor** - Restate what was accomplished

### For Debugging/Fixes:
1. **Verify** the actual current state (check files, not assumptions)
2. **Identify** the specific issue
3. **Fix** one thing at a time
4. **Test** to confirm fix works
5. **Update** KNOWN ISSUES when resolved

---

## 📝 VERSION HISTORY

- **CURRENT** (Nov 15, 2025) - Added "Verified Accomplishments & Context" section, updated with Feature 1 component status
- **v2.0** (Nov 15, 2025) - Restructured with Next Execution Focus at top
- **v1.0** (Nov 2025) - Initial core execution rules established

---

**END OF EXECUTION CONTRACT**

*This is a living document. Update VERIFIED ACCOMPLISHMENTS and CURRENT PROJECT STATE as work progresses.*
*The "Verified Accomplishments & Context" section should be copy-pasted into future prompts to maintain continuity.*

---

## 📎 QUICK COPY-PASTE FOR NEXT PROMPT

```
VERIFIED CONTEXT (from EXECUTION_CONTRACT_CURRENT.md):
- .env.local is configured correctly (Supabase: ktorvduzhojsvakixvcr)
- Dependencies installed (845 packages)
- Git connected to seantuckercm/mindous
- PRDs updated in /home/ubuntu/mindous/docs/PRD/
- Feature 1 (P0) components created in /home/ubuntu/mindous/src/components/runs/
- Database migration file exists but NOT YET APPLIED
- Components NOT YET INTEGRATED into app
- Backend API NOT YET IMPLEMENTED

NEXT: [Your instruction here]
```
