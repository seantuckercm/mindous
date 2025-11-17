
/**
 * Multi-LLM Dashboard - Mindous.ai
 * Main workspace for orchestrating tasks across multiple AI providers
 * Features intelligent task decomposition, LLM routing, and real-time monitoring
 */
import { MultiLLMWorkspace } from "@/components/llm/multi-llm-workspace";

/**
 * Main dashboard page component
 * Renders the comprehensive multi-LLM workspace interface
 */
export default function DashboardPage() {
  return (
    <main className="p-6 md:p-10">
      <MultiLLMWorkspace />
    </main>
  );
}
