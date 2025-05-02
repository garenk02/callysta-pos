'use client'

import React, { useState, useEffect } from 'react'
import { PaymentMethod, CardType, PaymentDetails } from '@/types'
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
  Smartphone,
  Gift,
  AlertCircle,
  Loader2
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  const [changeDue, setChangeDue] = useState<number>(0)

  // Hidden payment methods state (kept for future use)
  const [cardType, setCardType] = useState<CardType>('visa')
  const [cardNumber, setCardNumber] = useState<string>('')
  const [cardExpiry, setCardExpiry] = useState<string>('')
  const [cardCvv, setCardCvv] = useState<string>('')
  const [mobileProvider, setMobileProvider] = useState<string>('apple_pay')
  const [giftCardNumber, setGiftCardNumber] = useState<string>('')
  const [giftCardPin, setGiftCardPin] = useState<string>('')

  // Reset form when total changes
  useEffect(() => {
    resetPaymentForms()
  }, [total])

  // Reset all payment forms
  const resetPaymentForms = () => {
    // Reset cash payment
    setAmountTendered('')
    setChangeDue(0)

    // Reset card payment
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')

    // Reset mobile payment
    setMobileProvider('apple_pay')

    // Reset gift card
    setGiftCardNumber('')
    setGiftCardPin('')

    // Reset validation
    setValidationError(null)
  }

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethod)
    setValidationError(null)
  }

  const handleAmountTenderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null)
    const value = e.target.value
    setAmountTendered(value)

    const numValue = parseFloat(value) || 0
    const change = numValue - total
    setChangeDue(change > 0 ? change : 0)
  }

  // Set quick cash amount
  const handleQuickCashAmount = (amount: number) => {
    setAmountTendered(amount.toFixed(2))
    const change = amount - total
    setChangeDue(change > 0 ? change : 0)
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null)
    const value = e.target.value
    setCardNumber(formatCardNumber(value))

    // Auto-detect card type
    const cardNum = value.replace(/\s+/g, '')
    if (cardNum.startsWith('4')) {
      setCardType('visa')
    } else if (cardNum.startsWith('5')) {
      setCardType('mastercard')
    } else if (cardNum.startsWith('3')) {
      setCardType('amex')
    } else if (cardNum.startsWith('6')) {
      setCardType('discover')
    } else {
      setCardType('other')
    }
  }

  // Format card expiry date (MM/YY)
  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')

    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '')
    }

    return v
  }

  // Handle card expiry input
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null)
    const value = e.target.value
    setCardExpiry(formatCardExpiry(value))
  }

  // Validate the payment based on the selected method
  const validatePayment = (): boolean => {
    if (paymentMethod === 'cash') {
      const tenderedAmount = parseFloat(amountTendered) || 0
      if (tenderedAmount < total) {
        setValidationError(`Amount tendered must be at least Rp. ${total.toLocaleString('id-ID')}`)
        return false
      }
    } else if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s+/g, '').length < 13) {
        setValidationError('Please enter a valid card number')
        return false
      }
      if (cardExpiry.length < 5) {
        setValidationError('Please enter a valid expiry date (MM/YY)')
        return false
      }
      if (cardCvv.length < 3) {
        setValidationError('Please enter a valid CVV code')
        return false
      }
    } else if (paymentMethod === 'mobile_payment') {
      if (!mobileProvider) {
        setValidationError('Please select a mobile payment provider')
        return false
      }
    } else if (paymentMethod === 'gift_card') {
      if (giftCardNumber.length < 8) {
        setValidationError('Please enter a valid gift card number')
        return false
      }
      if (giftCardPin.length < 4) {
        setValidationError('Please enter a valid PIN')
        return false
      }
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
        const tenderedAmount = parseFloat(amountTendered) || 0
        paymentDetails = {
          amount_tendered: tenderedAmount,
          change_due: changeDue
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
      const tenderedAmount = parseFloat(amountTendered) || 0
      return tenderedAmount >= total
    }

    if (paymentMethod === 'card') {
      return cardNumber.replace(/\s+/g, '').length >= 13 &&
             cardExpiry.length === 5 &&
             cardCvv.length >= 3
    }

    if (paymentMethod === 'mobile_payment') {
      return !!mobileProvider
    }

    if (paymentMethod === 'gift_card') {
      return giftCardNumber.length >= 8 && giftCardPin.length >= 4
    }

    return true
  }

  return (
    <div className="w-full mt-4">
      {/* Receipt Modal */}
      {receiptData && (
        <Receipt
          open={showReceipt}
          onOpenChange={setShowReceipt}
          order={receiptData}
        />
      )}

      <Tabs
        defaultValue="cash"
        value={paymentMethod}
        onValueChange={handlePaymentMethodChange}
      >
        <TabsList className="grid grid-cols-1 mb-4">
          <TabsTrigger value="cash">
            <Banknote className="h-4 w-4 mr-2" />
            Cash
          </TabsTrigger>
          {/* Other payment methods hidden for now */}
          {/*
          <TabsTrigger value="card">
            <CreditCard className="h-4 w-4 mr-2" />
            Card
          </TabsTrigger>
          <TabsTrigger value="mobile_payment">
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="gift_card">
            <Gift className="h-4 w-4 mr-2" />
            Gift Card
          </TabsTrigger>
          */}
        </TabsList>

        {/* Cash Payment Tab */}
        <TabsContent value="cash" className="mt-0">
          <Card>
            <CardContent className="pt-4 pb-2">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="amount-tendered">Amount Tendered</Label>
                    <Input
                      id="amount-tendered"
                      type="number"
                      min={total}
                      step="0.01"
                      placeholder="0.00"
                      value={amountTendered}
                      onChange={handleAmountTenderedChange}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="change-due">Change Due</Label>
                    <Input
                      id="change-due"
                      value={`Rp. ${changeDue.toLocaleString('id-ID')}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label>Quick Amounts</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {[10000, 20000, 50000, 100000].map(amount => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCashAmount(amount)}
                        disabled={disabled}
                      >
                        Rp. {amount.toLocaleString('id-ID')}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCashAmount(Math.ceil(total / 1000) * 1000)}
                      disabled={disabled}
                    >
                      Exact: Rp. {(Math.ceil(total / 1000) * 1000).toLocaleString('id-ID')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCashAmount(Math.ceil(total / 5000) * 5000)}
                      disabled={disabled}
                    >
                      Round: Rp. {(Math.ceil(total / 5000) * 5000).toLocaleString('id-ID')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other payment methods hidden for now */}
        {/* Card Payment Tab, Mobile Payment Tab, and Gift Card Tab are hidden */}
      </Tabs>

      {validationError && (
        <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{validationError}</span>
        </div>
      )}

      <Button
        className="w-full mt-4"
        size="lg"
        onClick={handleCompleteSale}
        disabled={disabled || !isPaymentValid() || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Sale
          </>
        )}
      </Button>
    </div>
  )
}
