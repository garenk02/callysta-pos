import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldErrorProps {
  message?: string | null;
  className?: string;
}

/**
 * FieldError component for displaying field-level error messages
 * with consistent styling and icon
 */
export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div 
      className={cn(
        "flex items-start gap-1.5 mt-1.5 text-xs text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
