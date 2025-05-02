import React from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';
import { FormError } from '@/components/ui/form-error';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedFormProps {
  form: UseFormReturn<any>;
  onSubmit: (values: any) => void;
  children: React.ReactNode;
  error?: string | null;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
  submitButtonClassName?: string;
  cancelButtonClassName?: string;
}

/**
 * Enhanced form component with consistent styling, error handling, and loading states
 */
export function EnhancedForm({
  form,
  onSubmit,
  children,
  error,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  isSubmitting = false,
  className,
  submitButtonClassName,
  cancelButtonClassName,
}: EnhancedFormProps) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
        {error && <FormError message={error} />}
        
        {children}
        
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className={cancelButtonClassName}
            >
              {cancelText}
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={submitButtonClassName}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
