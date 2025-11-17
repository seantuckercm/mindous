import TaskForm from '@/src/components/task-form';

export default function NewTaskPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Task</h1>
          <p className="text-muted-foreground mt-2">
            Describe what you want to build or automate, and let AI handle the rest.
          </p>
        </div>
        <TaskForm />
      </div>
    </div>
  );
}
