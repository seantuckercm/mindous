# Run Progress Components (P0)

This directory contains the P0 (priority 0) components for Feature 1: Real-time Progress Streaming and Transparency.

## Components

### 1. TaskCard (`task-card.tsx`)

Individual task/subtask card component that displays execution status with visual indicators.

**Features:**
- Status icons (spinner for running, checkmark for success, X for failed)
- Color-coded status badges and card backgrounds
- Expandable details section for logs and error messages
- Duration calculation for completed tasks
- Responsive design with proper text wrapping

**Usage:**
```tsx
import { TaskCard } from '@/src/components/runs';

<TaskCard
  id="subtask-1"
  title="Installing dependencies"
  status="running"
  statusDetail="Running npm install..."
  startedAt={new Date()}
  onExpand={(expanded) => console.log('Expanded:', expanded)}
>
  {/* Optional: Additional details like logs, artifacts */}
  <div>Detailed logs here...</div>
</TaskCard>
```

**Props:**
- `id` (string, required): Unique identifier for the task
- `title` (string, required): Task title/description
- `status` (TaskStatus, required): Current status - 'queued' | 'running' | 'succeeded' | 'failed' | 'paused' | 'canceled'
- `statusDetail` (string, optional): Additional status information
- `icon` (ReactNode, optional): Custom icon (defaults to AI avatar)
- `startedAt` (Date, optional): Task start time
- `finishedAt` (Date, optional): Task completion time
- `errorMessage` (string, optional): Error message if task failed
- `children` (ReactNode, optional): Expandable content (logs, artifacts)
- `onExpand` (function, optional): Callback when card is expanded/collapsed
- `className` (string, optional): Additional CSS classes

### 2. StatusBar (`status-bar.tsx`)

Bottom sticky bar showing real-time progress with task and subtask counters.

**Features:**
- Persistent bottom positioning (sticky)
- Progress bar with percentage calculation
- Task and subtask counter with customizable format
- Active state indicator with spinner animation
- Current operation display
- Includes StatusBarSpacer component to prevent content overlap

**Usage:**
```tsx
import { StatusBar, StatusBarSpacer } from '@/src/components/runs';

function MyPage() {
  return (
    <div>
      {/* Your content */}
      <div>Main content here...</div>
      
      {/* Add spacer at bottom to prevent overlap */}
      <StatusBarSpacer />
      
      {/* Status bar - fixed at bottom */}
      <StatusBar
        currentTask={1}
        totalTasks={1}
        currentSubtask={3}
        totalSubtasks={10}
        currentOperation="Installing dependencies..."
        isActive={true}
      />
    </div>
  );
}
```

**Props:**
- `currentTask` (number, default: 1): Current task number
- `totalTasks` (number, default: 1): Total number of tasks
- `currentSubtask` (number, default: 1): Current subtask number
- `totalSubtasks` (number, default: 1): Total number of subtasks
- `currentOperation` (string, optional): Description of current operation
- `isActive` (boolean, default: false): Whether execution is active (shows spinner)
- `className` (string, optional): Additional CSS classes

### 3. RunProgressPanel (`run-progress-panel.tsx`)

Main orchestration component that manages the entire run progress view.

**Features:**
- Displays run header with title and ID
- Lists all subtasks using TaskCard components
- Integrates StatusBar for progress tracking
- Pause/Resume/Cancel controls with loading states
- Automatic progress calculation
- Error handling with toast notifications
- Loading states for data fetching
- Responsive scrollable subtask list

**Usage:**
```tsx
import { RunProgressPanel } from '@/src/components/runs';

function RunPage({ params }: { params: { runId: string } }) {
  const handlePause = async (runId: string) => {
    // Call API to pause run
    await fetch(`/api/runs/${runId}/pause`, { method: 'POST' });
  };

  const handleCancel = async (runId: string) => {
    // Call API to cancel run
    await fetch(`/api/runs/${runId}/cancel`, { method: 'POST' });
  };

  const handleResume = async (runId: string) => {
    // Call API to resume run
    await fetch(`/api/runs/${runId}/resume`, { method: 'POST' });
  };

  return (
    <RunProgressPanel
      runId={params.runId}
      onPause={handlePause}
      onCancel={handleCancel}
      onResume={handleResume}
    />
  );
}
```

**Props:**
- `runId` (string, required): Unique identifier for the run
- `initialData` (RunData, optional): Initial run data to avoid loading state
- `onPause` (function, optional): Callback to pause the run
- `onCancel` (function, optional): Callback to cancel the run
- `onResume` (function, optional): Callback to resume a paused run
- `className` (string, optional): Additional CSS classes

## Types

### TaskStatus
```typescript
type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'paused' | 'canceled';
```

### Subtask
```typescript
interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  statusDetail?: string;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  order: number;
}
```

### RunData
```typescript
interface RunData {
  id: string;
  title: string;
  status: TaskStatus;
  subtasks: Subtask[];
  startedAt: Date;
  finishedAt?: Date;
}
```

## Color Scheme

Following the PRD specifications:

- **Purple (#7C3AED)**: Active/running states
- **Green (#10B981)**: Success states
- **Red**: Error/failed states
- **Yellow**: Warning/paused states
- **Gray**: Neutral/inactive states

## Design Patterns

All components follow these patterns:
- **TypeScript**: Full type safety with exported types
- **Tailwind CSS**: Utility-first styling
- **ShadCN**: Consistent UI components
- **Client Components**: "use client" directive for interactivity
- **Accessibility**: ARIA labels and semantic HTML
- **Responsive**: Mobile-first responsive design
- **Error Handling**: Toast notifications for user feedback

## Integration with Backend

These components expect:
1. An API endpoint at `/api/runs/[runId]` that returns RunData
2. Optional control endpoints for pause/cancel/resume operations
3. Real-time updates can be integrated via SSE or WebSocket (see PRD for full implementation)

## Next Steps (P1 Components)

The following components are planned for the next phase:
- `tool-usage-panel.tsx`: Right sidebar showing active tool usage
- `file-operation-badge.tsx`: Badge for file operations
- `run-progress-tree.tsx`: Hierarchical tree view of subtasks
- `subtask-node.tsx`: Tree node component
- `event-log.tsx`: Virtualized event log viewer
- `control-buttons.tsx`: Dedicated control button component
