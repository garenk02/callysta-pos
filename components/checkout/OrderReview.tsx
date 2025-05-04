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
  isCompact?: boolean
}

export default function OrderReview({
  cart,
  total,
  paymentMethod,
  paymentDetails,
  customerInfo,
  onBack,
  onConfirm,
  isProcessing,
  isCompact = false
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
    <div className={`${isCompact ? 'space-y-2' : 'space-y-3'} flex flex-col`}>
      <h3 className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>Order Review</h3>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto" style={{
        minHeight: isCompact ? "80px" : "100px",
        maxHeight: isCompact ? "150px" : "200px"
      }}>
        {/* Items summary */}
        <div className={`border rounded-md ${isCompact ? 'p-1.5 mb-2' : 'p-2 mb-3'}`}>
          <h4 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium ${isCompact ? 'mb-0.5' : 'mb-1'}`}>
            Items ({cart.length})
          </h4>
          <ScrollArea className={isCompact ? "max-h-[60px]" : "max-h-[80px]"}>
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
        <div className={`border rounded-md ${isCompact ? 'p-1.5 mb-2' : 'p-2 mb-3'}`}>
          <h4 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium ${isCompact ? 'mb-0.5' : 'mb-1'}`}>
            Payment
          </h4>
          <div className={`${isCompact ? 'space-y-0.5' : 'space-y-1'} ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
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
        <div className={`border rounded-md ${isCompact ? 'p-1.5 mb-2' : 'p-2 mb-3'}`}>
          <h4 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium ${isCompact ? 'mb-0.5' : 'mb-1'}`}>
            Customer Information
          </h4>
          <div className={`${isCompact ? 'space-y-0.5' : 'space-y-1'} ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
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
      </div>

      {/* Total - Always visible */}
      <div className="sticky bottom-0 bg-background pt-1">
        <Separator className={isCompact ? "mb-1" : "mb-2"} />
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Action buttons - Always visible at the bottom */}
      <div className={`flex gap-2 ${isCompact ? 'pt-1' : 'pt-2'} sticky bottom-0 bg-background`}>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
          style={{ height: isCompact ? "32px" : "36px" }}
        >
          <ArrowLeft className={`${isCompact ? 'h-3 w-3 mr-0.5' : 'h-3.5 w-3.5 mr-1'}`} />
          Back
        </Button>

        <Button
          size="sm"
          onClick={() => setShowConfirmDialog(true)}
          disabled={isProcessing}
          className="flex-1"
          style={{
            height: isCompact ? "32px" : "36px",
            backgroundColor: "#FF54BB",
            color: "white"
          }}
        >
          {isProcessing ? (
            <>
              <span className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} animate-spin rounded-full border-2 border-current border-t-transparent mr-1`}></span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className={`${isCompact ? 'h-3 w-3 mr-0.5' : 'h-3.5 w-3.5 mr-1'}`} />
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
