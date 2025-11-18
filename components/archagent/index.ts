/**
 * ArchAgent Components
 * Phase 2 Implementation - Full Feature Set with Real-time Monitoring
 */

import dynamic from 'next/dynamic';

export { ClarificationModal } from './clarification-modal';

// Export TerminalViewer with SSR disabled to avoid xterm.js SSR issues
export const TerminalViewer = dynamic(
  () => import('./terminal-viewer').then(mod => ({ default: mod.TerminalViewer })),
  { ssr: false }
);

export { FileBrowser } from './file-browser';

// Export Phase 2 components with SSR disabled
export const DesktopViewer = dynamic(
  () => import('./desktop-viewer').then(mod => ({ default: mod.DesktopViewer })),
  { ssr: false }
);

export const CodeDiffViewer = dynamic(
  () => import('./code-diff-viewer').then(mod => ({ default: mod.CodeDiffViewer })),
  { ssr: false }
);

export const DatabaseViewer = dynamic(
  () => import('./database-viewer').then(mod => ({ default: mod.DatabaseViewer })),
  { ssr: false }
);

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
