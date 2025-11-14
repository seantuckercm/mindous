/**
 * Test page for TaskForm component
 * This page allows testing the TaskForm UI without authentication
 * FOR TESTING PURPOSES ONLY - Remove in production
 */
import TaskForm from "@/src/components/task-form";

export default function TestTaskFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Task Form Test Page</h1>
        <p className="text-gray-600 mb-8">
          This page is for testing the TaskForm component. 
          Note: API calls will fail without authentication.
        </p>
        <TaskForm />
      </div>
    </div>
  );
}
