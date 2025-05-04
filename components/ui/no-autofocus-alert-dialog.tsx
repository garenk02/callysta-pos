"use client"

import * as React from "react"
import { AlertDialogContent } from "@/components/ui/alert-dialog"
import type { ComponentProps } from "react"

type AlertDialogContentProps = ComponentProps<typeof AlertDialogContent>

/**
 * A wrapper around AlertDialogContent that prevents autofocus on dialog open
 * This is useful for dialogs that contain forms where you don't want the first input to be focused automatically
 */
export function NoAutofocusAlertDialogContent({
  children,
  ...props
}: AlertDialogContentProps) {
  // Prevent autofocus by stopping propagation of the event
  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  // Prevent focus issues when closing the dialog
  const handleCloseAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  return (
    <AlertDialogContent
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={handleCloseAutoFocus}
      // Remove forceMount as it causes dialogs to show when they shouldn't
      // Add tabIndex to prevent focus issues
      tabIndex={-1}
      {...props}
    >
      {children}
    </AlertDialogContent>
  )
}
