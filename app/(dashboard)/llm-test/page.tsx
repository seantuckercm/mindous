'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LLMTestPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Task Execution</h1>
          <p className="text-muted-foreground mt-2">
            Experience seamless AI-powered task execution with Abacus AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Intelligent Task Processing
            </CardTitle>
            <CardDescription>
              Our AI automatically handles your tasks with optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Automatic Optimization</h3>
                  <p className="text-sm text-muted-foreground">
                    Tasks are automatically optimized for performance and efficiency
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Transparent Execution</h3>
                  <p className="text-sm text-muted-foreground">
                    See every step of how your tasks are processed in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Powered by Abacus AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Leveraging advanced AI capabilities for superior results
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href="/dashboard/tasks">
                <Button className="w-full sm:w-auto">
                  Go to Tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This page previously contained multi-LLM routing test features.
                The system has been redesigned to focus on transparency and simplicity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
