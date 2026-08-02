'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SectionErrorProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export function SectionError({ title, message, onRetry }: SectionErrorProps) {
  return (
    <Alert variant="destructive" role="alert" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title ?? 'Something went wrong'}</AlertTitle>
      {message && <AlertDescription>{message}</AlertDescription>}
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        aria-label="Retry loading this section"
        className="mt-2"
      >
        Retry
      </Button>
    </Alert>
  );
}
