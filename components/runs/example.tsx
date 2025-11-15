"use client";

/**
 * Example/Demo file showing how to use the Run Progress components
 * This file demonstrates the P0 components with mock data
 */

import { RunProgressPanel, type RunData } from './run-progress-panel';

// Mock data for demonstration
const mockRunData: RunData = {
  id: 'run-123456',
  title: 'Build a Modern Landing Page with React and Tailwind CSS',
  status: 'running',
  startedAt: new Date(Date.now() - 120000), // Started 2 minutes ago
  subtasks: [
    {
      id: 'subtask-1',
      title: 'Planning project structure',
      status: 'succeeded',
      statusDetail: 'Analyzed requirements and created project outline',
      startedAt: new Date(Date.now() - 120000),
      finishedAt: new Date(Date.now() - 90000),
      order: 1,
    },
    {
      id: 'subtask-2',
      title: 'Setting up development environment',
      status: 'succeeded',
      statusDetail: 'Initialized Next.js project with TypeScript',
      startedAt: new Date(Date.now() - 90000),
      finishedAt: new Date(Date.now() - 60000),
      order: 2,
    },
    {
      id: 'subtask-3',
      title: 'Installing dependencies',
      status: 'running',
      statusDetail: 'Running npm install for required packages...',
      startedAt: new Date(Date.now() - 60000),
      order: 3,
    },
    {
      id: 'subtask-4',
      title: 'Creating component structure',
      status: 'queued',
      statusDetail: 'Waiting to start',
      order: 4,
    },
    {
      id: 'subtask-5',
      title: 'Implementing header component',
      status: 'queued',
      order: 5,
    },
    {
      id: 'subtask-6',
      title: 'Implementing hero section',
      status: 'queued',
      order: 6,
    },
    {
      id: 'subtask-7',
      title: 'Adding responsive styles',
      status: 'queued',
      order: 7,
    },
    {
      id: 'subtask-8',
      title: 'Testing and optimization',
      status: 'queued',
      order: 8,
    },
  ],
};

// Mock data for failed run
const mockFailedRunData: RunData = {
  id: 'run-789012',
  title: 'Deploy Application to Production',
  status: 'failed',
  startedAt: new Date(Date.now() - 300000), // Started 5 minutes ago
  finishedAt: new Date(Date.now() - 60000), // Finished 1 minute ago
  subtasks: [
    {
      id: 'subtask-1',
      title: 'Running pre-deployment checks',
      status: 'succeeded',
      statusDetail: 'All checks passed',
      startedAt: new Date(Date.now() - 300000),
      finishedAt: new Date(Date.now() - 270000),
      order: 1,
    },
    {
      id: 'subtask-2',
      title: 'Building production bundle',
      status: 'failed',
      statusDetail: 'Build process encountered errors',
      errorMessage: 'Error: Module not found: Cannot resolve "@/components/missing-component"',
      startedAt: new Date(Date.now() - 270000),
      finishedAt: new Date(Date.now() - 60000),
      order: 2,
    },
    {
      id: 'subtask-3',
      title: 'Deploying to production server',
      status: 'canceled',
      statusDetail: 'Canceled due to build failure',
      order: 3,
    },
  ],
};

/**
 * Example component showing a running execution
 */
export function RunProgressExample() {
  const handlePause = async (runId: string) => {
    console.log('Pausing run:', runId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleCancel = async (runId: string) => {
    console.log('Canceling run:', runId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleResume = async (runId: string) => {
    console.log('Resuming run:', runId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Run Progress Panel - Example</h1>
        <p className="text-muted-foreground">
          Demonstration of P0 components with mock data
        </p>
      </div>

      <RunProgressPanel
        runId={mockRunData.id}
        initialData={mockRunData}
        onPause={handlePause}
        onCancel={handleCancel}
        onResume={handleResume}
      />
    </div>
  );
}

/**
 * Example component showing a failed execution
 */
export function FailedRunExample() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Failed Run - Example</h1>
        <p className="text-muted-foreground">
          Demonstration of error states and failed execution
        </p>
      </div>

      <RunProgressPanel
        runId={mockFailedRunData.id}
        initialData={mockFailedRunData}
      />
    </div>
  );
}

/**
 * Default export - running execution example
 */
export default RunProgressExample;
