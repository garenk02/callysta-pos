"use client"

import * as React from "react"
import { DialogContent, DialogContentProps } from "@/components/ui/dialog"

/**
 * A wrapper around DialogContent that prevents autofocus on dialog open
 * This is useful for dialogs that contain forms where you don't want the first input to be focused automatically
 */
export function NoAutofocusDialogContent({
  children,
  ...props
}: DialogContentProps) {
  // Prevent autofocus by stopping propagation of the event
  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  // Prevent focus issues when closing the dialog
  const handleCloseAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  return (
    <DialogContent
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={handleCloseAutoFocus}
      // Remove forceMount as it causes dialogs to show when they shouldn't
      // Add tabIndex to prevent focus issues
      tabIndex={-1}
      {...props}
    >
      {children}
    </DialogContent>
  )
}
