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
  const [formattedAmount, setFormattedAmount] = useState<string>('')
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
      const tenderedAmount = parseInt(amountTendered) || 0
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
    } else if (paymentMethod === 'bank_transfer') {
      // Bank transfer is always valid as it's just showing instructions
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

    if (paymentMethod === 'bank_transfer') {
      return true // Bank transfer is always valid as it's just showing instructions
    }

    return true
  }

  return (
    <div className="w-full mt-0">
      {/* Receipt Modal */}
      {receiptData && (
        <Receipt
          open={showReceipt}
          onOpenChange={setShowReceipt}
          order={receiptData}
        />
      )}

      <div className="mb-2">
        <Tabs
          value={paymentMethod}
          onValueChange={handlePaymentMethodChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 h-8 mb-1">
            <TabsTrigger value="cash" className="text-xs py-0 px-1 flex items-center">
              <Banknote className="h-4 w-4 mr-1" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="bank_transfer" className="text-xs py-0 px-1 flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              Bank Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cash" className="mt-0 pt-0">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label htmlFor="amount-tendered" className="text-xs block mb-1">Amount</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <span className="text-xs text-muted-foreground">Rp.</span>
                  </div>
                  <Input
                    id="amount-tendered"
                    type="text"
                    placeholder="0"
                    value={formattedAmount}
                    onChange={handleAmountTenderedChange}
                    disabled={disabled}
                    className="h-8 text-xs pl-8 pr-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="change-due" className="text-xs block mb-1">Change</Label>
                <Input
                  id="change-due"
                  value={`Rp. ${changeDue.toLocaleString('id-ID')}`}
                  disabled
                  className="bg-muted h-8 text-xs px-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCashAmount(Math.ceil(total / 1000) * 1000)}
                disabled={disabled}
                className="h-8 text-xs"
              >
                Exact: Rp. {(Math.ceil(total / 1000) * 1000).toLocaleString('id-ID')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCashAmount(Math.ceil(total / 5000) * 5000)}
                disabled={disabled}
                className="h-8 text-xs"
              >
                Round: Rp. {(Math.ceil(total / 5000) * 5000).toLocaleString('id-ID')}
              </Button>
            </div>
          </TabsContent>

          {/* <TabsContent value="bank_transfer" className="mt-0 pt-0">
            <div className="text-xs mb-2">
              <p className="font-medium mb-1">Bank Transfer Instructions:</p>
              <p className="mb-1">Transfer to: BCA 1234567890</p>
              <p>Amount: Rp. {total.toLocaleString('id-ID')}</p>
            </div>
          </TabsContent> */}
        </Tabs>
      </div>

      {validationError && (
        <div className="flex items-center gap-1 text-destructive text-xs mb-1">
          <AlertCircle className="h-3 w-3" />
          <span>{validationError}</span>
        </div>
      )}

      <Button
        className="w-full"
        size="default"
        onClick={handleCompleteSale}
        disabled={disabled || !isPaymentValid() || isProcessing}
        style={{ height: "45px", backgroundColor: "#FF54BB", color: "white" }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-base">Processing...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <span className="text-base">Complete Sale</span>
          </>
        )}
      </Button>
    </div>
  )
}
