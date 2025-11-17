
/**
 * Dashboard - Mindous.ai
 * AI-powered workspace for building and automation
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Plus, History, BarChart3 } from "lucide-react";
import Link from "next/link";

/**
 * Main dashboard page component
 */
export default function DashboardPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-muted-foreground">
          Your AI-powered workspace for building and automation
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle>New Task</CardTitle>
            </div>
            <CardDescription>
              Start a new AI task or automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/tasks/new">
                Create Task
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Task History</CardTitle>
            </div>
            <CardDescription>
              View and manage your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/tasks">
                View Tasks
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>
              Performance and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/analytics">
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>
            Your latest tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Create your first task to get started</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
