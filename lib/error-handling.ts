import { ZodError } from 'zod';
import { toast } from 'sonner';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

/**
 * Format ZodError into a standardized error response
 */
export function formatZodError(error: ZodError): ErrorResponse {
  const details: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });
  
  return {
    error: "Validation failed",
    details,
    code: "VALIDATION_ERROR"
  };
}

/**
 * Handle errors in server actions with consistent formatting
 */
export function handleServerActionError(error: unknown): ErrorResponse {
  console.error("Server action error:", error);
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return formatZodError(error);
  }
  
  // Handle Supabase errors
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const supabaseError = error as { code: string; message: string };
    
    // Handle specific Supabase error codes
    if (supabaseError.code === '23505') {
      return {
        error: "A record with this information already exists.",
        code: "DUPLICATE_ERROR"
      };
    }
    
    if (supabaseError.code === '23503') {
      return {
        error: "This operation would violate referential integrity constraints.",
        code: "FOREIGN_KEY_ERROR"
      };
    }
    
    return {
      error: supabaseError.message,
      code: supabaseError.code
    };
  }
  
  // Handle other errors
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  
  return {
    error: errorMessage,
    code: "UNKNOWN_ERROR"
  };
}

/**
 * Display error toast with consistent styling
 */
export function showErrorToast(message: string) {
  toast.error(message, {
    duration: 5000,
    position: "top-center",
  });
}

/**
 * Display success toast with consistent styling
 */
export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000,
    position: "top-center",
  });
}
