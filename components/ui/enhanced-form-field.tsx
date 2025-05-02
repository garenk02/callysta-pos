import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EnhancedFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'checkbox' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  className?: string;
  required?: boolean;
  disabled?: boolean;
  showErrorMessage?: boolean;
}

/**
 * Enhanced form field component with consistent styling and error handling
 */
export function EnhancedFormField({
  name,
  label,
  description,
  type = 'text',
  placeholder,
  options,
  className,
  required = false,
  disabled = false,
  showErrorMessage = true,
}: EnhancedFormFieldProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;
  const hasError = !!error;

  return (
    <FormItem className={cn("space-y-2", className)}>
      {label && (
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive", hasError && "text-destructive")}>
          {label}
        </FormLabel>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Handle different field types
          switch (type) {
            case 'textarea':
              return (
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={placeholder}
                    className={cn(hasError && "border-destructive focus-visible:ring-destructive/30")}
                    disabled={disabled}
                    value={field.value || ''}
                  />
                </FormControl>
              );
              
            case 'checkbox':
              return (
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                      className={cn(hasError && "border-destructive")}
                    />
                    {placeholder && <span className="text-sm">{placeholder}</span>}
                  </div>
                </FormControl>
              );
              
            case 'select':
              return (
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <SelectTrigger className={cn(hasError && "border-destructive focus-visible:ring-destructive/30")}>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              );
              
            default:
              return (
                <FormControl>
                  <Input
                    {...field}
                    type={type}
                    placeholder={placeholder}
                    className={cn(hasError && "border-destructive focus-visible:ring-destructive/30")}
                    disabled={disabled}
                    value={field.value || ''}
                  />
                </FormControl>
              );
          }
        }}
      />
      
      {description && <FormDescription>{description}</FormDescription>}
      
      {showErrorMessage && hasError && (
        <FieldError message={error} />
      )}
    </FormItem>
  );
}
