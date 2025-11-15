# Abacus.AI Platform Analysis - DeepAgent & ChatLLM
## Comprehensive Feature Inventory & PRD Alignment

**Date:** November 15, 2025  
**Analyst:** DeepAgent  
**Purpose:** Understand Abacus.AI platform to inform Mindous.ai development

---

## Executive Summary

Abacus.AI provides two primary interaction modes:
1. **DeepAgent** - Advanced agentic system for complex task execution
2. **ChatLLM** - Conversational AI with model routing capabilities

Key architectural patterns observed:
- Task decomposition with real-time progress tracking
- Tool transparency (users see what tools are being used)
- File operation logging with git-style diffs
- Comprehensive app lifecycle management
- Credit-based usage model (not token-based)
- Multi-conversation support per app/project
- MCP server integration for external tools

---

## 1. DEEPAGENT - Primary Focus

### 1.1 Landing Page & Onboarding

**UI Structure:**
- Large centered hero section with call-to-action
- Header: "What do you want to do?"
- Subtext: Capability description
- Large text input with placeholder: "Describe what you want to get done, be pretty detailed..."
- Input features: Attachment (📎), Voice (🎤), Send (→)

**Navigation Elements:**
- Top quick links: "Connectors | How-To | Competition"
- Category tabs: Featured, Apps, PowerPoint, Browser Use, More
- Subcategories per tab (e.g., Apps → Full Stack Apps, Live Dashboards, Stripe Integration, AI Apps, Content Apps)

**Example Prompts (Use Cases):**
1. Stripe Integrated Website
2. Books RAG Chatbot
3. Interdisciplinary analogies (research)
4. Weekly Dinner Dates (browser automation)
5. App with Stripe Payments

**First-time User Experience:**
- Welcome modal explaining DeepAgent capabilities
- Clear value proposition
- "Check it out" CTA button

### 1.2 Task Execution Flow

**Phase 1: Clarification (When Needed)**
- Agent asks structured questions before execution
- Numbered list format
- Examples provided in parentheses
- Option to "choose appropriate answers and move forward"
- Feedback buttons (👍👎)

**Phase 2: Planning**
- Status indicator: "Planning"
- Status indicator: "Understanding requirements"
- Status indicator: "Weighing the possibilities"

**Phase 3: Execution with Transparency**

**Task Card Pattern:**
```
┌─────────────────────────────────────────┐
│ [DeepAgent Icon] [Status Icon]          │
│ Task Title: "Creating a modern HTML..." │
│ Status: In progress / Completed         │
│ Status Detail: "Initializing"           │
└─────────────────────────────────────────┘
```

**Tool Usage Visibility (Side Panel):**
- Right-side panel opens during execution
- Header: "Task 1: [task name] > [current subtask]"
- Badge: "DeepAgent is using [Tool Name]"
- Tool-specific output displayed inline:
  - **Search:** Image grid with sources
  - **Terminal:** Command output with color coding
  - **Code Editor:** File content with syntax highlighting

**Progress Tracking:**
- Bottom status bar shows: "Task 1, Subtask X"
- Subtask counter increments as work progresses
- Clear indication of current operation

**File Operations:**
- Badge format: "[Action] ~/path/to/file"
- Actions: Written ✓, Updated ✓, Running
- Green checkmarks for completed operations
- Document icons for file previews
- Expandable command badges (⋮ icon)

**Code Editor Interface:**
```
┌─────────────────────────────────────────┐
│ Code | Preview   [⚙️] [📄] [🚀 Deploy] [✕] │
├─────────────────────────────────────────┤
│ / bean_haven_landing / nextjs_space /   │
│ app / page.tsx                          │
├─────────────────────────────────────────┤
│ [Code content with syntax highlighting] │
├─────────────────────────────────────────┤
│ Status: Updating ~/bean_haven_landing...│
│ Task 1, Subtask 12                      │
└─────────────────────────────────────────┘
```

**Preview Interface:**
```
┌─────────────────────────────────────────┐
│ Code | Preview   [⚙️] [❓] [📋] [🚀 Deploy]│
├─────────────────────────────────────────┤
│ [🔄] Your app is not deployed yet       │
│ [Current Version] [💻] [📱] [🖥️] [⛶]    │
├─────────────────────────────────────────┤
│ [Live app preview with full scrolling]  │
└─────────────────────────────────────────┘
```

**Diff View:**
- Git-style before/after comparison
- Line numbers on left
- Green/red highlighting for additions/deletions
- File paths shown (a/ vs b/)

**Terminal Output:**
- Command badge with expand option
- Real-time output streaming
- Color-coded output (success/error)
- Build progress indicators

### 1.3 Task Completion

**Completion Card:**
```
┌─────────────────────────────────────────┐
│ [DeepAgent Icon] [✓ Green Checkmark]    │
│ Task Title: "Creating a modern HTML..." │
│ Status: Completed                       │
└─────────────────────────────────────────┘
```

**File Operations Summary:**
- List of all file operations performed
- Badges with checkmarks for completed operations
- Download icons on hover
- Document preview icons for certain files

**Action CTAs:**
```
┌─────────────────────────────────────────┐
│ Web Application is ready, you can      │
│ preview it now or deploy it publicly   │
│                                         │
│   [▶ Preview]    [🚀 Deploy]           │
└─────────────────────────────────────────┘
```

**Management Links:**
- "You can manage the app from the App Management Console"
- "and set up your own custom domain" (linked)

**Summary Message:**
- Natural language description of deliverables
- Key features highlighted
- Tech stack mentioned
- Performance/SEO benefits noted

**Feedback & Metadata:**
- Thumbs up/down buttons
- **Credits Used:** Displayed prominently (e.g., "Credits Used: 623")

**Quick Actions:**
- 📁 Folder access button (e.g., "bean_haven_landing/nextjs_space")
- 📄 "View All files in this task"
- 🏆 "Enter competition" (gamification)

**Follow-up Input:**
- Input placeholder: "Specify any updates or changes you want to do for this task"
- Attachment, voice, send buttons
- **Stop button** (red square) during execution

### 1.4 Conversation Management

**Sidebar Organization:**
- Conversations auto-titled based on content
- Grouped by date: "Today", "Oct 24, 2025", etc.
- Active conversation highlighted in purple
- Search, add, collapse controls per section

---

## 2. CHATLLM - Secondary Focus

### 2.1 Interface Differences

**Model Selection:**
- Top center: Model selector dropdown (e.g., "RouteLLM" with crown icon)
- Routing transparency: "RouteLLM → Routing to GPT-5 Mini"

**Input Area:**
- Placeholder: "Write something..."
- Mode dropdown: "Chat" (with other options)
- Attachment (📎), Browse web (🌐), Voice (🎤), Send (→)

**Quick Action Buttons:**
- Image, Code, Playground, Powerpoint, Deep Research, More

**Suggested Prompts:**
- ☀️ Fun fact about Rome
- 🖼️ HTML landing page
- </> Python for fibonacci series

### 2.2 Response Format

**Model Routing Indicator:**
- Badge: "RouteLLM → Routing to [Model Name]"
- Model icon displayed

**Content Structure:**
- **"Quick summary"** heading for brief overview
- Structured sections with headings (e.g., "What is React?", "What is Next.js?")
- Bullet points for organized information
- Clean typography hierarchy

**Interaction Controls:**
- Collapse/expand button (floating circle with arrow)
- User message has share/edit icons

**Auto-naming:**
- Conversations automatically titled (e.g., "Next.js vs React Differences")

---

## 3. APP MANAGEMENT CONSOLE

### 3.1 Interface Layout

**URL:** apps.abacus.ai/chatllm/?appId=appllm_engineer

**Header:**
- "Apps" title (centered)
- "< Back to DeepAgent" link
- **Status filter:** Dropdown (All, Active, etc.)
- **"+ Create App"** button (purple)

**Help Links:**
- DeepAgent Apps How-To
- Custom Domains How-To

### 3.2 App Table Structure

**Columns:**
1. **#** - Sequential number
2. **Name** - App name + timestamp (e.g., "6 minutes ago")
3. **Conversations** - "View" link + "+" icon (add conversation)
4. **Deployment** - Status indicator (- for not deployed)
5. **Versions** - "View" link (version history)
6. **Database | Storage** - "View" links or "-" if not configured
7. **Custom Domain** - "Configure" link + "Manage Domains" link

### 3.3 Key Features Observed

**Multi-Conversation Support:**
- Each app can have multiple conversations
- "+" button to add new conversation to existing app
- "View" link to see all conversations for an app

**Version Management:**
- Track different versions of the same app
- "View" link to access version history

**Database Integration:**
- Separate database configuration per app
- Storage management separate from app code

**Deployment Tracking:**
- Clear deployment status in table
- Not deployed shows as "-"

**Custom Domains:**
- Configure custom domain per app
- "Manage Domains" for organization-level settings

---

## 4. PLATFORM INFRASTRUCTURE

### 4.1 Navigation Structure

**Left Sidebar (Main Interface):**
- **Projects** section (search, add, collapse)
- **Chats** section (search, add, collapse)
  - Grouped by date
  - Auto-titled conversations
- **DeepAgent** section (search, add, collapse)
  - Grouped by date
  - Task-based titles
- **DeepAgent button** (purple, prominent)
- **Tools** section (collapsible)
  - Apple, Android icons
  - "Abacus AI Desktop" button

**Admin Sidebar (Settings/Admin):**
1. Profile & Billing
2. Tasks
3. Projects
4. Connectors
   - First Party Connectors
   - MCP Server Configuration
   - Messaging Connectors
5. Manage
   - Bots
   - Team
   - Groups
   - Permissions
6. Deep Agent Competition

### 4.2 Profile & Billing

**Personal Information:**
- Avatar and name (editable)
- Email (changeable)
- Team/Organization name (editable)
- Password (can be set)

**Subscription Tier:**
- Current tier displayed (e.g., "Pro")
- Downgrade/Upgrade options
- "Learn more" link
- Pricing: $20/month for Pro

**Billing Details:**
- Start date
- Next billing date
- "Billing Details" link

**Credits System:**
- **Total:** Available credits (e.g., 415,000)
- **Used:** Credits consumed (e.g., 375,000)
- **Remaining:** Credits left (e.g., 40,000)
- Refresh date and time (UTC)
- **View Credits Usage** link
- **Buy Credits** option
- **View Credits Invoices** link

**Important Notes:**
- "Credits are NOT TOKENS"
- 25K credits per user per month
- 10K credits ≈ 70M tokens on some LLMs
- Pricing varies by model and task type (video/image generation)

### 4.3 Tasks Management

**URL:** apps.abacus.ai/chatllm/admin/tasks/

**Interface:**
- "Tasks" header with back button
- "+ New Task" button
- "Help Center" link
- Section: "Active"
- Empty state: "No active tasks"

**Purpose:**
- Manage scheduled/recurring tasks
- Background automation tasks
- Browser automation tasks (e.g., weekly reservations)

### 4.4 Projects Management

**URL:** apps.abacus.ai/chatllm/admin/projects/

**Interface:**
- "Projects" header
- "+ Create Project" button
- Project cards with:
  - Project name
  - Creator email
  - Last updated timestamp

**Purpose:**
- Organize work by project
- Group related chats/tasks/apps
- Multi-user collaboration

### 4.5 Connectors

#### First Party Connectors

**URL:** apps.abacus.ai/chatllm/admin/connectors-list

**Interface:**
- "Add Connector" button
- Table with: Connector name, ID
- Empty state initially
- Note about org-level connectors

**Purpose:**
- Connect to external services (Gmail, Slack, GitHub, etc.)
- Organization-level vs user-level
- Enable DeepAgent to interact with external systems

#### MCP Server Configuration

**URL:** apps.abacus.ai/chatllm/admin/mcp/

**Key Information:**
- "DeepAgent can interact with external tools and data sources via the Model Context Protocol (MCP) servers"
- Can add up to 10 servers
- "Example" button (shows sample configuration)
- "Available Tools" section
- **"Ask AI"** button for configuration help
- "+ Add" button to add new MCP server

**Purpose:**
- Extend DeepAgent capabilities with custom tools
- Integrate with external APIs/services
- Process context from external sources

---

## 5. PRD ALIGNMENT ANALYSIS

### 5.1 Features We MUST Replicate (Carbon Copy)

#### ✅ CRITICAL - DeepAgent Core

1. **Task Execution with Transparency**
   - Real-time tool usage visibility (side panel)
   - Progress tracking (Task X, Subtask Y)
   - File operation badges with checkmarks
   - Terminal output display
   - Code editor with syntax highlighting
   - Preview functionality
   - Status indicators (Planning, In progress, Completed)

2. **Task Decomposition**
   - Automatic breakdown into subtasks
   - Sequential execution tracking
   - Clear progression indicators

3. **Multi-Step Task Flow**
   - Clarification questions when needed
   - Planning phase
   - Execution phase with visibility
   - Completion summary with CTAs

4. **File Management**
   - Track all file operations (Written, Updated, Running)
   - Git-style diff views
   - File download capabilities
   - "View All files in this task"
   - Folder access buttons

5. **Code Editor Integration**
   - Syntax highlighting
   - File tree navigation
   - Code/Preview toggle
   - Settings and configuration
   - Deploy functionality

6. **Preview System**
   - Live app preview in iframe
   - Device preview modes (desktop, tablet, mobile)
   - "Not deployed" warning
   - Current version indicator
   - Responsive preview

7. **App Lifecycle Management**
   - Preview → Deploy workflow
   - Version tracking
   - Deployment status
   - Custom domain configuration
   - Database/storage integration

8. **App Management Console**
   - Centralized app listing
   - Multi-conversation support per app
   - Version history
   - Deployment tracking
   - Database/storage management
   - Custom domain configuration

#### ✅ HIGH PRIORITY - Chat & Conversation

9. **Conversation Management**
   - Auto-title generation
   - Date-based grouping
   - Search within conversations
   - Add new conversation
   - Separate Chat vs DeepAgent sections

10. **Model Selection & Routing**
    - Model selector dropdown
    - Routing transparency (which model was used)
    - Support for multiple LLM backends

11. **Input Flexibility**
    - Text input with attachments
    - Voice input
    - Web browsing capability
    - File upload

12. **Response Formatting**
    - Structured markdown output
    - Collapsible sections
    - Feedback buttons (thumbs up/down)
    - Share/edit message options

#### ✅ MEDIUM PRIORITY - Platform Infrastructure

13. **Credit System**
    - Credit-based usage tracking (not token-based)
    - Real-time credit consumption display
    - Monthly allocation per user
    - Purchase additional credits
    - Usage history/invoices
    - Credit refresh schedule

14. **Project Organization**
    - Create and manage projects
    - Group conversations by project
    - Multi-user collaboration
    - Project metadata (creator, last updated)

15. **Task Scheduling**
    - Create scheduled tasks
    - Background task execution
    - Browser automation tasks
    - Task status tracking (Active, Completed)

16. **External Integrations**
    - First-party connectors (Gmail, Slack, GitHub, etc.)
    - MCP server configuration
    - Custom tool integration
    - Organization vs user-level connectors

17. **Settings & Profile**
    - User profile management
    - Team/organization settings
    - Subscription tier management
    - Billing information
    - Theme toggle (light/dark)

### 5.2 Features Nice to Have (Not Critical for MVP)

- 🏆 Competition/gamification features
- 🤝 Refer friends / Invite team
- 🧠 Memories (context preservation across conversations)
- 📊 RouteLLM API access
- 🖥️ Desktop application
- 📱 Mobile apps (iOS/Android)
- 📧 Messaging connectors
- 👥 Groups and permissions management
- 🤖 Bots management

### 5.3 PRD Gaps & Recommendations

**PRD 1: Multi-LLM Routing and Execution**
- ✅ Aligns: Model selection, routing transparency
- ⚠️ Gap: Need to define specific routing logic (not visible in UI)
- 📝 Add: Routing history/logs feature

**PRD 2: Agentic Execution (assumed based on file names)**
- ✅ Aligns: Task decomposition, subtask tracking, tool visibility
- ✅ Aligns: Real-time progress indicators
- 📝 Add: More granular error handling UI

**PRD 3: Web Application Builder (assumed)**
- ✅ Aligns: Code editor, preview, deploy workflow
- ✅ Aligns: File operations tracking
- ✅ Aligns: App Management Console
- ⚠️ Gap: Version diffing not shown in detail
- 📝 Add: Rollback functionality UI

**PRD 4: External Integrations (assumed)**
- ✅ Aligns: MCP server configuration
- ✅ Aligns: First-party connectors
- ⚠️ Gap: Visual workflow builder for integrations
- 📝 Add: Integration testing interface

**PRD 5: Credit Management (assumed)**
- ✅ Aligns: Credit tracking, usage display
- ✅ Aligns: Purchase flow, invoices
- 📝 Add: Credit usage predictions
- 📝 Add: Budget alerts

---

## 6. TECHNICAL OBSERVATIONS

### 6.1 UI/UX Patterns

**Color Scheme:**
- Primary: Purple/violet (#7C3AED or similar)
- Success: Green (checkmarks)
- Warning: Red (downgrade, stop)
- Neutral: Grays for backgrounds and borders

**Typography:**
- Serif font for hero headings (Bean Haven example)
- Sans-serif for UI elements
- Clear hierarchy with multiple heading levels

**Layout:**
- Left sidebar: Navigation and conversation history
- Main area: Primary content
- Right panel: Contextual tool information (during execution)
- Bottom: Input area (persistent)

**Interactions:**
- Hover states reveal additional actions
- Expandable/collapsible sections
- Modal overlays for important flows
- Inline editing capabilities
- Copy-to-clipboard functionality

**Status Indicators:**
- Loading animations (vertical bars for Abacus logo)
- Progress spinners
- Checkmarks for completion
- Color-coded badges
- Subtask counters

### 6.2 Performance Considerations

**Real-time Updates:**
- Status changes reflect immediately
- Subtask counter increments live
- File operations appear as they happen
- Terminal output streams in real-time

**Lazy Loading:**
- Conversation history loads on demand
- File content loaded when expanded
- Image search results load progressively

**Preview Performance:**
- Preview disabled until build completes
- Clear messaging about preview availability
- Device emulation built-in

### 6.3 Tech Stack Observations

**Frontend:**
- Modern React-based SPA
- Real-time updates (likely WebSockets)
- Syntax highlighting (Monaco editor or similar)
- Responsive design patterns

**Backend (Inferred):**
- Task queue system (subtask tracking)
- File storage (for generated files)
- Build system (Next.js deployment)
- Database (for conversation history, app metadata)

**Integrations:**
- Search APIs for image search
- Terminal/code execution environment
- Deployment infrastructure
- MCP protocol support

---

## 7. KEY INSIGHTS FOR MINDOUS.AI

### 7.1 Must-Have Architecture

1. **Task Execution Engine**
   - Break down complex tasks into subtasks
   - Track progress at subtask level
   - Log all operations (file, command, API calls)
   - Real-time status updates to frontend

2. **Tool Transparency System**
   - Side panel for tool execution details
   - Inline results display (search, terminal, etc.)
   - Clear "Agent is using [Tool]" indicators
   - Expandable details for each operation

3. **File Operation Tracking**
   - Every file write/update logged
   - Badge system for operations
   - Download capabilities
   - Diff viewer for changes

4. **Code Editor Integration**
   - Syntax highlighting
   - File tree navigation
   - Preview functionality
   - Settings and configuration

5. **App Lifecycle Management**
   - Preview before deploy
   - Version tracking
   - Deployment status
   - Multi-conversation per app

6. **Credit System**
   - Track usage in credits (not tokens)
   - Display credit consumption per task
   - Monthly allocation
   - Purchase flow

### 7.2 Critical User Flows

**Flow 1: New Task Execution**
```
User Input → Clarification (if needed) → Planning → 
Execution (with real-time visibility) → Completion → 
Preview/Deploy CTAs
```

**Flow 2: App Preview & Deploy**
```
Task Complete → Preview Button → Preview Modal → 
Deploy Button → Deployment Configuration → 
App Management Console
```

**Flow 3: Multi-Conversation App Development**
```
App Management Console → Select App → View Conversations → 
Add New Conversation → Continue Development → 
Version Tracking
```

### 7.3 Design Principles Observed

1. **Transparency Over Abstraction**
   - Show what the agent is doing
   - Display tool usage openly
   - Log every operation
   - Make status clear at all times

2. **Progressive Disclosure**
   - Start simple (just input box)
   - Reveal complexity as needed (side panel)
   - Expandable details (command badges)
   - Collapsible responses

3. **Clear Visual Hierarchy**
   - Task cards stand out
   - Status indicators prominent
   - CTAs visually distinct
   - Consistent badge system

4. **Actionable Feedback**
   - Every completed task has next steps
   - Preview/Deploy always visible
   - Quick actions readily available
   - Help links contextual

5. **Credit Transparency**
   - Show usage after every task
   - Display remaining balance
   - Clear pricing model
   - No hidden costs

---

## 8. RECOMMENDED NEXT STEPS

### 8.1 Immediate Actions

1. ✅ **Review this analysis with team**
   - Align on must-have features
   - Prioritize based on PRD goals
   - Identify technical dependencies

2. **Update PRDs based on findings**
   - Add missing UI/UX patterns
   - Clarify tool transparency requirements
   - Define credit system mechanics
   - Detail app lifecycle management

3. **Create UI/UX mockups**
   - Match Abacus.AI patterns closely
   - Focus on task execution interface
   - Design tool visibility panel
   - Mock up app management console

4. **Define technical architecture**
   - Task queue system (Redis/BullMQ)
   - Real-time communication (WebSockets)
   - File storage strategy
   - LLM integration layer
   - Credit tracking system

### 8.2 Phase 1 MVP Scope

**Core Features for MVP:**
1. Basic DeepAgent interface (input, task execution, completion)
2. Single LLM backend (OpenAI or Anthropic)
3. Tool transparency (at least: code execution, file operations)
4. File operation tracking with badges
5. Basic code editor (syntax highlighting, view-only)
6. Simple chat interface (model selector, conversation history)
7. Credit tracking (basic usage display)
8. Conversation management (list, create, delete)

**Phase 1 Exclusions:**
- App deployment infrastructure
- Custom domains
- MCP server configuration
- Task scheduling
- Team/organization features
- Advanced version control

### 8.3 Phase 2 Enhancements

**After MVP Validation:**
1. App Management Console
2. Multi-conversation per app
3. Preview functionality
4. Basic deployment (to internal hosting)
5. MCP server support
6. Multi-LLM routing
7. Advanced credit management (purchase, invoices)
8. Project organization

### 8.4 Phase 3 & Beyond

**Future Enhancements:**
1. Custom domain support
2. Database/storage management
3. Task scheduling and automation
4. Team collaboration features
5. Version control with rollback
6. Integration marketplace
7. Mobile applications
8. Desktop application

---

## 9. VISUAL REFERENCE CHECKLIST

### 9.1 UI Components to Replicate

- [ ] Large centered input with icon buttons
- [ ] Category tabs with subcategories
- [ ] Task card with status icon and title
- [ ] Side panel for tool execution details
- [ ] File operation badges (Written ✓, Updated ✓, Running)
- [ ] Code editor with file tree
- [ ] Code/Preview toggle
- [ ] Preview modal with device emulation
- [ ] Deploy button (prominent purple)
- [ ] App Management Console table
- [ ] Credit usage display
- [ ] Conversation sidebar with date grouping
- [ ] Model selector dropdown
- [ ] Feedback buttons (thumbs up/down)
- [ ] Quick action buttons row
- [ ] Status indicators (loading, success, error)
- [ ] Diff viewer (git-style)
- [ ] Terminal output display
- [ ] Image search result grid
- [ ] Collapsible response sections

### 9.2 Interaction Patterns to Match

- [ ] Auto-save conversation titles
- [ ] Real-time subtask counter updates
- [ ] Expandable command badges
- [ ] Hover-reveal download buttons
- [ ] Click-to-copy functionality
- [ ] Smooth panel transitions
- [ ] Loading animations (Abacus logo style)
- [ ] Modal overlays for important actions
- [ ] Inline error messaging
- [ ] Toast notifications for background actions

---

## 10. CONCLUSION

Abacus.AI's DeepAgent provides an excellent reference implementation for Mindous.ai. The key differentiator is **transparency** - users can see exactly what the agent is doing at all times through:

1. Real-time tool usage visibility
2. Comprehensive file operation logging
3. Subtask-level progress tracking
4. Terminal and code output display
5. Clear status indicators throughout

The **App Management Console** is a critical feature for managing multiple apps and conversations, supporting the full lifecycle from development to deployment.

The **credit-based system** (not token-based) provides a simpler mental model for users and allows for flexible pricing across different models and task types.

**Most Important Takeaway:** Mindous.ai should prioritize building the core execution transparency features first (task cards, tool visibility, file operations) before tackling deployment infrastructure. Users need to trust the agent by seeing what it's doing.

---

**END OF ANALYSIS**
