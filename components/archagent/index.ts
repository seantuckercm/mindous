/**
 * ArchAgent Components
 * Phase 1 Implementation - Transparency and User Control Features
 */

import dynamic from 'next/dynamic';

export { ClarificationModal } from './clarification-modal';

// Export TerminalViewer with SSR disabled to avoid xterm.js SSR issues
export const TerminalViewer = dynamic(
  () => import('./terminal-viewer').then(mod => ({ default: mod.TerminalViewer })),
  { ssr: false }
);

export { FileBrowser } from './file-browser';

// Export Workspace components with SSR disabled (they use TerminalViewer)
export const ArchAgentWorkspace = dynamic(
  () => import('./workspace-layout').then(mod => ({ default: mod.ArchAgentWorkspace })),
  { ssr: false }
);

export const ArchAgentWorkspaceSimple = dynamic(
  () => import('./workspace-layout').then(mod => ({ default: mod.ArchAgentWorkspaceSimple })),
  { ssr: false }
);

export type { FileNode } from './file-browser';
