'use client'

import React, { useState, useEffect } from 'react'
import { PaymentMethod, PaymentDetails } from '@/types'
import { createOrder } from '@/lib/supabase/client-orders'
import { useAuth } from '@/hooks/useAuth'
import Receipt from './Receipt'
import CustomerInfo, { CustomerInfoData } from './CustomerInfo'
import OrderReview from './OrderReview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  Banknote,
  AlertCircle,
  Loader2,
  ArrowRight
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
  isCompact?: boolean
}

export default function PaymentSection({
  total,
  onPaymentComplete,
  disabled,
  isCompact = false
}: PaymentSectionProps) {
  const { user } = useAuth()
  const { cart, summary, clearCart } = useCart()

  // Step management
  const [currentStep, setCurrentStep] = useState<'payment' | 'review'>('payment')

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoData>({
    name: '',
    phone: ''
  })

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
    customerInfo?: CustomerInfoData
  } | null>(null)

  // Cash payment state
  const [amountTendered, setAmountTendered] = useState<string>('')
  const [formattedAmount, setFormattedAmount] = useState<string>('')
  const [changeDue, setChangeDue] = useState<number>(0)

  // Additional payment method states can be added here when needed

  // Reset form when total changes
  useEffect(() => {
    resetPaymentForms()
    // Reset to payment step when total changes
    setCurrentStep('payment')
  }, [total])

  // Reset all payment forms
  const resetPaymentForms = () => {
    // Reset cash payment
    setAmountTendered('')
    setFormattedAmount('')
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

  // Handle proceeding to review step
  const handleProceedToReview = () => {
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

    // Move to review step
    setCurrentStep('review')
  }

  // Handle going back to payment step
  const handleBackToPayment = () => {
    setCurrentStep('payment')
  }

  // Handle completing the sale after review
  const handleCompleteSale = async () => {
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

      // Add customer info to payment details if provided
      if (customerInfo.name || customerInfo.phone) {
        paymentDetails.customer_info = {
          name: customerInfo.name,
          phone: customerInfo.phone
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

      // Call the onPaymentComplete callback with payment details
      // This will trigger the page loading indicator in the parent component
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
        cashierName: user?.name,
        customerInfo: customerInfo.name || customerInfo.phone ? customerInfo : undefined
      })

      // Clear the cart after payment is complete
      clearCart()

      // Reset payment form
      resetPaymentForms()

      // Reset customer info
      setCustomerInfo({ name: '', phone: '' })

      // Show success message with order ID
      toast.success(`Sale completed successfully! Order ID: ${orderId.slice(0, 8)}...`)

      // Show receipt
      setShowReceipt(true)

      // Reset to payment step for next order
      setCurrentStep('payment')
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
    <div className={`w-full mt-1 max-w-full pb-2 ${isCompact ? 'compact-payment' : ''}`}>
      {/* Receipt Modal */}
      {receiptData && (
        <Receipt
          open={showReceipt}
          onOpenChange={setShowReceipt}
          order={receiptData}
        />
      )}

      {currentStep === 'payment' ? (
        /* Payment Step */
        <>
          <div className={`${isCompact ? 'mb-0.5' : 'mb-1'}`}>
            <Tabs
              value={paymentMethod}
              onValueChange={handlePaymentMethodChange}
              className="w-full"
            >
              <TabsList className={`grid grid-cols-2 ${isCompact ? 'h-7' : 'h-8'} ${isCompact ? 'mb-0.5' : 'mb-1'}`}>
                <TabsTrigger value="cash" className="text-xs py-0 px-2 flex items-center">
                  <Banknote className={`${isCompact ? 'h-3 w-3 mr-0.5' : 'h-3.5 w-3.5 mr-1'}`} />
                  Cash
                </TabsTrigger>
                <TabsTrigger value="bank_transfer" className="text-xs py-0 px-2 flex items-center">
                  <CreditCard className={`${isCompact ? 'h-3 w-3 mr-0.5' : 'h-3.5 w-3.5 mr-1'}`} />
                  Bank Transfer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cash" className="mt-0 pt-0">
                {isCompact ? (
                  /* Compact layout for desktop */
                  <>
                    <div className="flex gap-1 mb-0.5">
                      <div className="w-3/5">
                        <div className="flex items-center">
                          <Label htmlFor="amount-tendered" className="text-xs whitespace-nowrap mr-1">Amount:</Label>
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                              <span className="text-xs text-muted-foreground">Rp.</span>
                            </div>
                            <Input
                              id="amount-tendered"
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={formattedAmount}
                              onChange={handleAmountTenderedChange}
                              disabled={disabled}
                              className="h-7 text-xs pl-7 pr-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-2/5">
                        <div className="flex items-center">
                          <Label htmlFor="change-due" className="text-xs whitespace-nowrap mr-1">Change:</Label>
                          <Input
                            id="change-due"
                            value={`${changeDue.toLocaleString('id-ID')}`}
                            disabled
                            className="bg-muted h-7 text-xs px-1 flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick amount buttons in compact grid */}
                    <div className="grid grid-cols-4 gap-0.5 mb-0.5">
                      {[10000, 20000, 50000, 100000].map(amount => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickCashAmount(amount)}
                          disabled={disabled}
                          className="h-6 text-[10px] px-0.5"
                        >
                          {amount.toLocaleString('id-ID')}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-0.5 mb-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCashAmount(Math.ceil(total / 1000) * 1000)}
                        disabled={disabled}
                        className="h-6 text-[10px] px-0.5"
                      >
                        Exact: {(Math.ceil(total / 1000) * 1000).toLocaleString('id-ID')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCashAmount(Math.ceil(total / 5000) * 5000)}
                        disabled={disabled}
                        className="h-6 text-[10px] px-0.5"
                      >
                        Round: {(Math.ceil(total / 5000) * 5000).toLocaleString('id-ID')}
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Original layout for mobile */
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div>
                        <Label htmlFor="amount-tendered" className="text-xs block mb-0.5">Amount Tender</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                            <span className="text-xs text-muted-foreground">Rp.</span>
                          </div>
                          <Input
                            id="amount-tendered"
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={formattedAmount}
                            onChange={handleAmountTenderedChange}
                            disabled={disabled}
                            className="h-8 text-xs pl-8 pr-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="change-due" className="text-xs block mb-0.5">Change Due</Label>
                        <Input
                          id="change-due"
                          value={`Rp. ${changeDue.toLocaleString('id-ID')}`}
                          disabled
                          className="bg-muted h-8 text-xs px-2"
                        />
                      </div>
                    </div>

                    {/* Quick amount buttons - more mobile friendly */}
                    <div className="grid grid-cols-4 gap-1 mb-1">
                      {[10000, 20000, 50000, 100000].map(amount => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickCashAmount(amount)}
                          disabled={disabled}
                          className="h-7 text-xs px-1 md:text-[10px] md:px-0.5"
                        >
                          {amount.toLocaleString('id-ID')}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCashAmount(Math.ceil(total / 1000) * 1000)}
                        disabled={disabled}
                        className="h-7 text-xs px-2 md:text-[10px] md:px-1"
                      >
                        Exact: {(Math.ceil(total / 1000) * 1000).toLocaleString('id-ID')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCashAmount(Math.ceil(total / 5000) * 5000)}
                        disabled={disabled}
                        className="h-7 text-xs px-2 md:text-[10px] md:px-1"
                      >
                        Round: {(Math.ceil(total / 5000) * 5000).toLocaleString('id-ID')}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="bank_transfer" className="mt-0 pt-0">
                <div className={`text-xs ${isCompact ? 'mb-0.5 p-1.5' : 'mb-1 p-2'} bg-muted/50 rounded-md`}>
                  <p className="font-medium mb-0.5">Bank Transfer Instructions:</p>
                  <p className={`${isCompact ? 'mt-0.5' : 'mt-1'} text-xs text-muted-foreground`}>Make sure to transfer to correct bank account</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Customer Information Section */}
          <div className={`${isCompact ? 'mb-1 mt-1 border-t pt-1' : 'mb-2 mt-3 border-t pt-2'}`}>
            <CustomerInfo
              customerInfo={customerInfo}
              onChange={setCustomerInfo}
              disabled={disabled}
              isCompact={isCompact}
            />
          </div>

          {validationError && (
            <div className={`flex items-center gap-1 text-destructive text-xs ${isCompact ? 'mb-0.5 p-1' : 'mb-1 p-1.5'} bg-destructive/10 rounded-md`}>
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <Button
            className="w-full mt-1"
            size="sm"
            onClick={handleProceedToReview}
            disabled={disabled || !isPaymentValid() || isProcessing}
            style={{ height: isCompact ? "36px" : "40px", backgroundColor: "#FF54BB", color: "white" }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                <span className="text-sm font-medium">Processing...</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">Review Order</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </>
      ) : (
        /* Review Step */
        <OrderReview
          cart={cart}
          total={total}
          paymentMethod={paymentMethod}
          paymentDetails={
            paymentMethod === 'cash'
              ? { amount_tendered: parseInt(amountTendered) || 0, change_due: changeDue }
              : { bank_reference: `ORDER-${new Date().getTime()}` }
          }
          customerInfo={customerInfo}
          onBack={handleBackToPayment}
          onConfirm={handleCompleteSale}
          isProcessing={isProcessing}
          isCompact={isCompact}
        />
      )}
    </div>
  )
}
