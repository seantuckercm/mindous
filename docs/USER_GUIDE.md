# Mindous.ai User Guide

**Welcome to Mindous.ai** - Your intelligent AI workspace for building applications, automating workflows, and solving complex problems with complete transparency.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Chat Interface](#chat-interface)
4. [Task Management](#task-management)
5. [Task Breakdown](#task-breakdown)
6. [Analytics](#analytics)
7. [Settings](#settings)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Navigate to the Mindous.ai homepage
2. Click **"Start Free"** or **"Sign In"** in the top right
3. Create an account using:
   - Email and password
   - Google account
   - GitHub account
4. Verify your email address
5. You'll be automatically redirected to your dashboard

### First Login

Upon your first login, you'll see:
- **Welcome message** with a quick tour
- **Empty dashboard** ready for your first task
- **Sidebar navigation** to explore different features
- **Usage credits** display showing your available credits

---

## Dashboard Overview

The dashboard is your central hub for managing AI tasks and monitoring activity.

### Main Components

#### 1. **Sidebar Navigation**
Located on the left side, provides quick access to:
- 🏠 **Workspace** - Main dashboard
- 💬 **Chat** - AI conversation interface
- 📋 **Tasks** - Task management and monitoring
- 📊 **Analytics** - Performance metrics and insights
- ⚙️ **Settings** - Account and preferences

#### 2. **Start Chat Card**
- Quick access to open a new chat session
- Click **"Open Chat"** to begin conversing with the AI

#### 3. **Task Breakdown Section**
- Text area to describe complex tasks
- **"Break Down Task"** button to generate subtasks
- AI automatically analyzes and creates actionable steps

#### 4. **AI Tools Activity Panel**
- Real-time visibility into what the AI is doing
- Shows active tools being used
- Displays file operations, API calls, and more
- Complete transparency into AI actions

#### 5. **Recent Tasks**
- Quick view of your latest tasks
- Status indicators (Running, Completed, Paused, Failed)
- Click any task to view details

#### 6. **Usage Credits Display**
- Shows remaining credits (e.g., "0 of 5 used")
- "5 left" indicator
- **Upgrade** button for premium features
- Resets date display

---

## Chat Interface

The chat interface is where you interact with the AI assistant to get help, ask questions, and initiate tasks.

### Starting a Chat

1. Click **"Chat"** in the sidebar or **"Open Chat"** on the dashboard
2. You'll see a clean interface with:
   - Message history area
   - Input field at the bottom
   - Send button (paper plane icon)

### Sending Messages

1. Type your message in the input field
2. Press **Enter** or click the **Send** button
3. Your message appears on the right in a blue bubble
4. AI response streams in real-time on the left

### Chat Features

#### Message History
- All messages are saved automatically
- Scroll up to view previous conversations
- Timestamps show when each message was sent

#### Streaming Responses
- AI responses appear word-by-word in real-time
- Loading indicator shows when AI is thinking
- Can interrupt or stop generation if needed

#### Context Awareness
- AI remembers the last 10 messages in the conversation
- Maintains context across multiple exchanges
- Can reference previous messages

### Example Conversations

**Simple Question:**
```
You: What can you help me with?
AI: I can help you build applications, analyze data, automate 
workflows, and solve complex problems. I can break down tasks 
into manageable steps and execute them with complete transparency.
```

**Complex Task:**
```
You: I need to build a React todo app with authentication and 
deploy it to Vercel.

AI: I'll break this down into steps:
1. Initialize React project with TypeScript
2. Set up authentication with Clerk
3. Build todo list components
4. Configure Vercel deployment
5. Deploy the application

Would you like me to proceed with these steps?
```

---

## Task Management

The Tasks page provides comprehensive management of all your AI-powered tasks.

### Task List View

#### Status Summary Cards
At the top of the page, you'll see:
- **Total Tasks** - All tasks created
- **Running** - Currently executing tasks
- **Completed** - Successfully finished tasks
- **Paused** - Temporarily stopped tasks
- **Failed** - Tasks that encountered errors

#### Task Cards

Each task is displayed as a card showing:
- **Task Title** - Clear description of the task
- **Status Badge** - Color-coded status indicator
  - 🟢 Green = Completed
  - 🔵 Blue = Running
  - 🟠 Orange = Paused
  - 🔴 Red = Failed
- **Timestamps** - Created and completed times
- **Subtask Progress** - e.g., "3/5 subtasks"
- **Cost** - Credits used (e.g., "$1.89")
- **Progress Bar** - Visual percentage for running tasks
- **Action Buttons** - Context-specific actions

### Task Actions

#### For Running Tasks:
- **View Details** - See full task breakdown
- **Pause** - Temporarily stop execution

#### For Completed Tasks:
- **View Details** - Review what was done
- **Download Results** - Export task outputs

#### For Paused Tasks:
- **View Details** - Check current state
- **Resume** - Continue execution

#### For Failed Tasks:
- **View Details** - See error information
- **Retry** - Attempt task again

### Filtering and Search

#### Status Filter
- Click tabs to filter by status:
  - **All (5)** - Show all tasks
  - **Running (1)** - Only active tasks
  - **Completed (2)** - Finished tasks
  - **Paused (1)** - Stopped tasks
  - **Failed (1)** - Error tasks

#### Search Bar
- Type to search task titles and descriptions
- Real-time filtering as you type
- Case-insensitive search

#### Export Report
- Click **"Export Report"** button
- Downloads comprehensive task report
- Includes all task details and metrics

---

## Task Breakdown

The Task Breakdown feature uses AI to decompose complex tasks into manageable subtasks.

### How It Works

1. **Describe Your Task**
   - Enter a detailed description in the text area
   - Be specific about what you want to accomplish
   - Include any requirements or constraints

2. **Generate Breakdown**
   - Click **"Break Down Task"** button
   - AI analyzes your request
   - Generates structured subtasks with dependencies

3. **Review Subtasks**
   - Each subtask includes:
     - Clear title and description
     - Estimated duration
     - Dependencies on other subtasks
     - Order of execution

4. **Edit and Approve**
   - Modify subtasks if needed
   - Reorder steps by dragging
   - Add or remove subtasks
   - Click **"Approve & Execute"** to start

### Example Task Breakdown

**Input:**
```
Create a simple todo list web application with React, add 
authentication, and deploy it to Vercel
```

**Generated Breakdown:**
1. **Initialize React project with TypeScript**
   - Duration: 15 minutes
   - Dependencies: None
   
2. **Implement authentication with Clerk**
   - Duration: 30 minutes
   - Dependencies: Step 1
   
3. **Build todo list components**
   - Duration: 45 minutes
   - Dependencies: Steps 1, 2
   
4. **Deploy to Vercel**
   - Duration: 20 minutes
   - Dependencies: Step 3

**Total Estimated Duration:** 110 minutes

### Best Practices for Task Descriptions

✅ **Good Examples:**
- "Build a React dashboard with charts showing sales data from a CSV file"
- "Create a Python script to scrape product prices from Amazon and save to database"
- "Design a landing page for a SaaS product with pricing tiers and testimonials"

❌ **Avoid:**
- "Make a website" (too vague)
- "Do something with data" (unclear objective)
- "Fix the bug" (no context provided)

---

## Analytics

The Analytics page provides insights into your task execution and AI usage.

### Available Metrics

#### Task Analytics
- **Total Tasks** - Number of tasks created
- **Success Rate** - Percentage of completed tasks
- **Average Duration** - Mean time to complete tasks
- **Performance** - Overall efficiency metrics

#### Cost Analytics
- **Total Spend** - Credits used across all tasks
- **Cost per Task** - Average credit usage
- **Cost Trends** - Spending over time

#### LLM Usage
- **Total Requests** - API calls made
- **Tokens Used** - Total token consumption
- **Model Distribution** - Usage by AI model

### Coming Soon

The analytics dashboard is being enhanced with:
- 📈 **Interactive Charts** - Visual data representation
- 📊 **Detailed Reports** - Exportable analytics
- 🎯 **Performance Insights** - AI-powered recommendations
- 📅 **Time-based Analysis** - Daily, weekly, monthly views

---

## Settings

Manage your account preferences and configuration.

### Account Settings

#### Profile Information
- Update name and email
- Change password
- Manage connected accounts

#### Preferences
- Theme selection (Light/Dark)
- Notification settings
- Language preferences

#### API Access
- Generate API keys
- View usage limits
- Manage webhooks

### Billing & Usage

#### Current Plan
- View active subscription
- See included credits
- Check renewal date

#### Upgrade Options
- **Free Plan** - 5 credits/month
- **Pro Plan** - 100 credits/month
- **Enterprise** - Unlimited credits

#### Usage History
- Credit consumption over time
- Detailed transaction log
- Download invoices

---

## Best Practices

### Writing Effective Prompts

#### Be Specific
❌ "Build a website"  
✅ "Build a React website with a homepage, about page, and contact form using Tailwind CSS"

#### Provide Context
❌ "Analyze this data"  
✅ "Analyze this sales data CSV file and create a report showing monthly trends, top products, and revenue forecasts"

#### Break Down Complex Requests
❌ "Create a full e-commerce platform"  
✅ "First, let's create the product catalog page with filtering and search functionality"

### Managing Tasks Efficiently

#### Monitor Progress
- Check the Tasks page regularly
- Review AI Tools Activity panel
- Watch for errors or warnings

#### Pause When Needed
- Pause tasks if you need to make changes
- Review intermediate results
- Resume when ready to continue

#### Learn from Failures
- Check failed task details
- Understand what went wrong
- Adjust your approach for next time

### Optimizing Credit Usage

#### Combine Related Tasks
- Group similar operations together
- Reduces overhead and saves credits

#### Use Task Breakdown
- Better planning = fewer retries
- Clear subtasks = efficient execution

#### Review Before Executing
- Double-check task descriptions
- Ensure requirements are clear
- Avoid unnecessary iterations

---

## Troubleshooting

### Common Issues

#### Chat Not Responding

**Symptoms:** Message sent but no AI response

**Solutions:**
1. Check your internet connection
2. Refresh the page
3. Try sending the message again
4. Contact support if issue persists

**Note:** Currently requires `ABACUSAI_API_KEY` configuration

---

#### Task Breakdown Fails

**Symptoms:** "Break Down Task" button doesn't generate subtasks

**Solutions:**
1. Ensure task description is clear and detailed
2. Check that you have available credits
3. Try simplifying the task description
4. Refresh the page and try again

**Note:** Currently requires `ABACUSAI_API_KEY` configuration

---

#### Task Stuck in "Running" Status

**Symptoms:** Task shows as running but no progress

**Solutions:**
1. Wait a few minutes (some tasks take time)
2. Check the AI Tools Activity panel for updates
3. Click "View Details" to see current step
4. If stuck for >10 minutes, click "Pause" then "Resume"

---

#### Authentication Issues

**Symptoms:** Logged out unexpectedly or can't access features

**Solutions:**
1. Clear browser cookies and cache
2. Log out and log back in
3. Check that your email is verified
4. Try a different browser

---

### Getting Help

#### In-App Support
- Click the help icon (?) in the top right
- Access documentation and guides
- Submit a support ticket

#### Community
- Join our Discord server
- Browse community forums
- Share tips and tricks

#### Contact Us
- Email: support@mindous.ai
- Response time: Within 24 hours
- Priority support for Pro/Enterprise users

---

## Keyboard Shortcuts

### Global
- `Ctrl/Cmd + K` - Open command palette
- `Ctrl/Cmd + /` - Toggle sidebar
- `Ctrl/Cmd + ,` - Open settings

### Chat Interface
- `Enter` - Send message
- `Shift + Enter` - New line
- `Esc` - Clear input
- `↑` - Edit last message

### Task Management
- `Ctrl/Cmd + N` - New task
- `Ctrl/Cmd + F` - Search tasks
- `Space` - Pause/Resume selected task
- `Delete` - Delete selected task

---

## Tips & Tricks

### Power User Features

#### 1. **Batch Operations**
Select multiple tasks and perform actions on all at once:
- Pause multiple running tasks
- Delete completed tasks
- Export multiple task results

#### 2. **Task Templates**
Save common task patterns as templates:
- "Build React App"
- "Data Analysis Pipeline"
- "API Integration"

#### 3. **Custom Workflows**
Chain tasks together for complex workflows:
- Task A completes → Task B starts automatically
- Conditional execution based on results
- Parallel task execution

#### 4. **Advanced Filtering**
Combine multiple filters:
- Status + Priority + Date range
- Tags + Search terms
- Custom saved filters

---

## Security & Privacy

### Data Protection
- All data encrypted in transit (TLS 1.3)
- Encrypted at rest in database
- Regular security audits
- GDPR compliant

### Privacy
- Your tasks and chats are private
- Not used for AI training without consent
- Can export or delete all data anytime
- Transparent data usage policies

### Authentication
- Secure authentication via Clerk
- Two-factor authentication available
- Session management and timeout
- OAuth integration (Google, GitHub)

---

## Frequently Asked Questions

### General

**Q: Is Mindous.ai free?**  
A: Yes! We offer a free plan with 5 credits per month. Upgrade to Pro for more credits and features.

**Q: What are credits?**  
A: Credits are used to execute tasks. Each task consumes credits based on complexity and duration.

**Q: Can I cancel anytime?**  
A: Yes, cancel your subscription anytime. You'll retain access until the end of your billing period.

### Technical

**Q: What AI models does Mindous.ai use?**  
A: We use GPT-4.1-mini, Claude 3.5 Sonnet, and Gemini 1.5 Pro, automatically selecting the best model for each task.

**Q: Can I use my own API keys?**  
A: Enterprise users can configure custom API keys. Contact sales for details.

**Q: Is there an API?**  
A: Yes! Check our [API Documentation](./API_ENDPOINTS.md) for details.

### Billing

**Q: How do credits work?**  
A: Each task consumes credits based on:
- AI model used
- Task complexity
- Execution time
- Resources required

**Q: What happens if I run out of credits?**  
A: Tasks will be paused. Upgrade your plan or wait for monthly credit reset.

**Q: Can I buy additional credits?**  
A: Yes, purchase credit packs anytime from the Settings page.

---

## Changelog

### Latest Updates

#### Version 1.0.0 (November 2025)
- 🎉 Initial release
- ✨ Chat interface with streaming
- 📋 Task management system
- 🔍 Task breakdown with AI
- 📊 Analytics dashboard
- 🔐 Clerk authentication
- 💾 Supabase database integration

---

## What's Next?

### Upcoming Features

#### Q1 2026
- 🎨 **Custom Themes** - Personalize your workspace
- 🔔 **Real-time Notifications** - Get instant updates
- 📱 **Mobile App** - iOS and Android apps
- 🤝 **Team Collaboration** - Share tasks and workspaces

#### Q2 2026
- 🔌 **Integrations** - Connect with Slack, GitHub, Notion
- 🎯 **Advanced Analytics** - ML-powered insights
- 🚀 **Workflow Automation** - No-code automation builder
- 💬 **Voice Interface** - Talk to your AI assistant

---

## Feedback & Suggestions

We'd love to hear from you!

- 💡 **Feature Requests** - Vote on our roadmap
- 🐛 **Bug Reports** - Help us improve
- ⭐ **Reviews** - Share your experience
- 📧 **Contact** - feedback@mindous.ai

---

**Thank you for using Mindous.ai!**

Build anything with AI. Complete transparency. Unlimited possibilities.

---

**Last Updated:** November 17, 2025  
**Version:** 1.0.0  
**Need Help?** support@mindous.ai
