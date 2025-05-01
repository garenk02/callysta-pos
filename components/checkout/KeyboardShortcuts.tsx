'use client'

import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Keyboard, HelpCircle } from 'lucide-react'

export default function KeyboardShortcuts() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Keyboard Shortcuts & Barcode Scanner</h4>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The search box supports barcode scanner input. Simply scan a product barcode and it will be automatically added to the cart.
            </p>
            
            <div className="rounded-md bg-muted p-3">
              <div className="text-xs">
                <div className="flex justify-between py-1">
                  <span className="font-medium">Search products</span>
                  <kbd className="bg-background px-2 py-0.5 rounded text-xs">Type in search box</kbd>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Add by barcode</span>
                  <kbd className="bg-background px-2 py-0.5 rounded text-xs">Scan barcode</kbd>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Quick add by SKU</span>
                  <kbd className="bg-background px-2 py-0.5 rounded text-xs">Type SKU + Enter</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
