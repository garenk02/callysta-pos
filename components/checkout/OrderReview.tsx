'use client'

import React, { useState } from 'react'
import { CartItem, PaymentMethod } from '@/types'
import { CustomerInfoData } from './CustomerInfo'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface OrderReviewProps {
  cart: CartItem[]
  total: number
  paymentMethod: PaymentMethod
  paymentDetails: any
  customerInfo: CustomerInfoData
  onBack: () => void
  onConfirm: () => void
  isProcessing: boolean
}

export default function OrderReview({
  cart,
  total,
  paymentMethod,
  paymentDetails,
  customerInfo,
  onBack,
  onConfirm,
  isProcessing
}: OrderReviewProps) {
  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  // Format payment method for display
  const formatPaymentMethod = (method: PaymentMethod): string => {
    switch (method) {
      case 'cash':
        return 'Cash'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Order Review</h3>

      {/* Items summary */}
      <div className="border rounded-md p-2">
        <h4 className="text-xs font-medium mb-1">Items ({cart.length})</h4>
        <ScrollArea className="max-h-[120px]">
          <div className="space-y-1">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between text-xs">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Payment details */}
      <div className="border rounded-md p-2">
        <h4 className="text-xs font-medium mb-1">Payment</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Method:</span>
            <span>{formatPaymentMethod(paymentMethod)}</span>
          </div>

          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span>Amount Tendered:</span>
                <span>{formatCurrency(paymentDetails.amount_tendered || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change Due:</span>
                <span>{formatCurrency(paymentDetails.change_due || 0)}</span>
              </div>
            </>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="flex justify-between">
              <span>Reference:</span>
              <span>{paymentDetails.bank_reference || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer info */}
      <div className="border rounded-md p-2">
        <h4 className="text-xs font-medium mb-1">Customer Information</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Name:</span>
            <span>{customerInfo.name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{customerInfo.phone || '-'}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div>
        <Separator className="my-2" />
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </Button>

        <Button
          size="sm"
          onClick={() => setShowConfirmDialog(true)}
          disabled={isProcessing}
          className="flex-1"
          style={{ backgroundColor: "#FF54BB", color: "white" }}
        >
          {isProcessing ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              <span>Confirm Order</span>
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Your Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to complete this sale? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowConfirmDialog(false);
                onConfirm();
              }}
              disabled={isProcessing}
              style={{ backgroundColor: "#FF54BB", color: "white" }}
            >
              {isProcessing ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Sale
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
