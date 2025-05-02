import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

/**
 * FormError component for displaying form-level error messages
 * with consistent styling and icon
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div 
      className={cn(
        "flex items-start gap-2 p-3 text-sm bg-destructive/10 text-destructive rounded-md mb-4",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>{message}</div>
    </div>
  );
}
