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
  // Use a ref to store the original onOpenAutoFocus handler
  const onOpenAutoFocusRef = React.useRef<((event: Event) => void) | null>(null)

  // Prevent autofocus by stopping propagation of the event
  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault()
    // If there was an original handler, we could call it here if needed
    // if (onOpenAutoFocusRef.current) onOpenAutoFocusRef.current(event)
  }, [])

  return (
    <DialogContent
      onOpenAutoFocus={handleOpenAutoFocus}
      {...props}
    >
      {children}
    </DialogContent>
  )
}
