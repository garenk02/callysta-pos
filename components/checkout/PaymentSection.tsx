'use client'

import React, { useState, useEffect } from 'react'
import { PaymentMethod, PaymentDetails } from '@/types'
import { createOrder } from '@/lib/supabase/client-orders'
import { useAuth } from '@/hooks/useAuth'
import Receipt from './Receipt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useCart } from '@/hooks/useCart'

interface PaymentSectionProps {
  total: number
  onPaymentComplete: (paymentMethod: PaymentMethod, paymentDetails?: PaymentDetails) => void
  disabled: boolean
}

export default function PaymentSection({
  total,
  onPaymentComplete,
  disabled
}: PaymentSectionProps) {
  const { user } = useAuth()
  const { cart, summary, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Receipt state
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    id: string
    date: Date
    items: { name: string; price: number; quantity: number; total: number }[]
    subtotal: number
    tax: number
    total: number
    paymentMethod: PaymentMethod
    paymentDetails?: PaymentDetails
    cashierName?: string
  } | null>(null)

  // Cash payment state
  const [amountTendered, setAmountTendered] = useState<string>('')
  const [formattedAmount, setFormattedAmount] = useState<string>('')
  const [changeDue, setChangeDue] = useState<number>(0)

  // Additional payment method states can be added here when needed

  // Reset form when total changes
  useEffect(() => {
    resetPaymentForms()
  }, [total])

  // Reset all payment forms
  const resetPaymentForms = () => {
    // Reset cash payment
    setAmountTendered('')
    setChangeDue(0)

    // Reset validation
    setValidationError(null)
  }

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethod)
    setValidationError(null)
  }

  const handleAmountTenderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null)
    const value = e.target.value.replace(/[^\d]/g, '')
    const numValue = parseInt(value) || 0

    setAmountTendered(numValue.toString())
    setFormattedAmount(numValue.toLocaleString('id-ID'))

    const change = numValue - total
    setChangeDue(change > 0 ? change : 0)
  }

  // Set quick cash amount
  const handleQuickCashAmount = (amount: number) => {
    setAmountTendered(amount.toString())
    setFormattedAmount(amount.toLocaleString('id-ID'))
    const change = amount - total
    setChangeDue(change > 0 ? change : 0)
  }

  // Payment formatting and validation functions can be added here as needed

  // Validate the payment based on the selected method
  const validatePayment = (): boolean => {
    if (paymentMethod === 'cash') {
      const tenderedAmount = parseInt(amountTendered) || 0
      if (tenderedAmount < total) {
        setValidationError(`Amount tendered must be at least Rp. ${total.toLocaleString('id-ID')}`)
        return false
      }
    } else if (paymentMethod === 'bank_transfer') {
      // Bank transfer is always valid as it's just showing instructions
      return true
    }

    return true
  }

  const handleCompleteSale = async () => {
    if (!validatePayment()) {
      return
    }

    if (!user) {
      setValidationError('You must be logged in to complete a sale')
      return
    }

    if (cart.length === 0) {
      setValidationError('Cart is empty')
      return
    }

    setIsProcessing(true)

    try {
      // Prepare payment details
      let paymentDetails: PaymentDetails = {}

      if (paymentMethod === 'cash') {
        const tenderedAmount = parseInt(amountTendered) || 0
        paymentDetails = {
          amount_tendered: tenderedAmount,
          change_due: changeDue
        }
      } else if (paymentMethod === 'bank_transfer') {
        paymentDetails = {
          // bank_name: 'BCA',
          // bank_account_number: '1234567890',
          bank_reference: `ORDER-${new Date().getTime()}`
        }
      }

      // Create the order in the database
      const { orderId, error } = await createOrder({
        userId: user.id,
        subtotal: summary.subtotal,
        tax: 0, // No tax
        total: summary.total,
        paymentMethod,
        paymentDetails,
        items: cart
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!orderId) {
        throw new Error('Failed to create order')
      }

      // Call the onPaymentComplete callback
      onPaymentComplete(paymentMethod, paymentDetails)

      // Prepare receipt data
      const receiptItems = cart.map(item => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity
      }))

      setReceiptData({
        id: orderId,
        date: new Date(),
        items: receiptItems,
        subtotal: summary.subtotal,
        tax: 0, // No tax
        total: summary.total,
        paymentMethod,
        paymentDetails,
        cashierName: user?.name
      })

      // Clear the cart after payment is complete
      clearCart()

      // Reset payment form
      resetPaymentForms()

      // Show success message with order ID
      toast.success(`Sale completed successfully! Order ID: ${orderId.slice(0, 8)}...`)

      // Show receipt
      setShowReceipt(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed'
      setValidationError(errorMessage)
      toast.error(errorMessage)
      console.error('Payment processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const isPaymentValid = (): boolean => {
    if (disabled) return false

    if (paymentMethod === 'cash') {
      const tenderedAmount = parseInt(amountTendered) || 0
      return tenderedAmount >= total
    }

    if (paymentMethod === 'bank_transfer') {
      return true // Bank transfer is always valid as it's just showing instructions
    }

    return true
  }

  return (
    <div className="w-full mt-2">
      {/* Receipt Modal */}
      {receiptData && (
        <Receipt
          open={showReceipt}
          onOpenChange={setShowReceipt}
          order={receiptData}
        />
      )}

      <div className="mb-3">
        <Tabs
          value={paymentMethod}
          onValueChange={handlePaymentMethodChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 h-9 mb-2">
            <TabsTrigger value="cash" className="text-sm py-0 px-2 flex items-center">
              <Banknote className="h-4 w-4 mr-2" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="bank_transfer" className="text-sm py-0 px-2 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Bank Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cash" className="mt-0 pt-0">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label htmlFor="amount-tendered" className="text-sm block mb-1.5">Amount Tender</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-sm text-muted-foreground">Rp.</span>
                  </div>
                  <Input
                    id="amount-tendered"
                    type="text"
                    placeholder="0"
                    value={formattedAmount}
                    onChange={handleAmountTenderedChange}
                    disabled={disabled}
                    className="h-9 text-sm pl-10 pr-3"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="change-due" className="text-sm block mb-1.5">Change Due</Label>
                <Input
                  id="change-due"
                  value={`Rp. ${changeDue.toLocaleString('id-ID')}`}
                  disabled
                  className="bg-muted h-9 text-sm px-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCashAmount(Math.ceil(total / 1000) * 1000)}
                disabled={disabled}
                className="h-9 text-sm"
              >
                Exact: Rp. {(Math.ceil(total / 1000) * 1000).toLocaleString('id-ID')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCashAmount(Math.ceil(total / 5000) * 5000)}
                disabled={disabled}
                className="h-9 text-sm"
              >
                Round: Rp. {(Math.ceil(total / 5000) * 5000).toLocaleString('id-ID')}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bank_transfer" className="mt-0 pt-0">
            <div className="text-sm mb-3 p-3 bg-muted/50 rounded-md">
              <p className="font-medium mb-1.5">Bank Transfer Instructions:</p>
              {/* <p className="mb-1.5">Transfer to: BCA 1234567890</p> */}
              <p>Amount: Rp. {total.toLocaleString('id-ID')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {validationError && (
        <div className="flex items-center gap-1.5 text-destructive text-sm mb-2 p-2 bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleCompleteSale}
        disabled={disabled || !isPaymentValid() || isProcessing}
        style={{ height: "48px", backgroundColor: "#FF54BB", color: "white" }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <span className="text-base font-medium">Processing...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <span className="text-base font-medium">Complete Sale</span>
          </>
        )}
      </Button>
    </div>
  )
}
