'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { ClarificationQuestion } from '@/lib/services/clarification-service';

interface ClarificationModalProps {
  open: boolean;
  questions: ClarificationQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onAutoDecide: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ClarificationModal({
  open,
  questions,
  onSubmit,
  onAutoDecide,
  onCancel,
  isSubmitting = false
}: ClarificationModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Validate required questions
    const newErrors: Record<string, string> = {};
    for (const q of questions) {
      if (q.required && !answers[q.id]) {
        newErrors[q.id] = 'This question is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(answers);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'design':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'features':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'data':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isSubmitting && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <DialogTitle>Help me understand your requirements</DialogTitle>
          </div>
          <DialogDescription>
            I've analyzed your request and have a few questions to ensure I build exactly what you need.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{answeredCount} of {questions.length} answered</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Question {i + 1}
                    </span>
                    <Badge
                      variant="secondary"
                      className={getCategoryColor(q.category)}
                    >
                      {q.category}
                    </Badge>
                    {q.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <Label className="text-base font-semibold">{q.question}</Label>
                  {q.explanation && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {q.explanation}
                    </p>
                  )}
                </div>
                {answers[q.id] && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                )}
              </div>

              <div className="mt-3">
                {q.options && q.options.length > 0 ? (
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(value) => {
                      setAnswers({ ...answers, [q.id]: value });
                      setErrors({ ...errors, [q.id]: '' });
                    }}
                  >
                    {q.options.map((option) => (
                      <div
                        key={option}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                        <Label
                          htmlFor={`${q.id}-${option}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                          {q.default === option && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Recommended
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Input
                    placeholder="Your answer..."
                    value={answers[q.id] || ''}
                    onChange={(e) => {
                      setAnswers({ ...answers, [q.id]: e.target.value });
                      setErrors({ ...errors, [q.id]: '' });
                    }}
                  />
                )}
              </div>

              {errors[q.id] && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors[q.id]}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onAutoDecide}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Choose for me
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Continue</>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
