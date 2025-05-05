'use client'

import React, { useRef } from 'react'
import { useSettings } from '@/hooks/useSettings'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Printer,
  Download,
  Share2,
  Loader2
} from 'lucide-react'
import { Order, OrderItem, PaymentMethod, PaymentDetails } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CustomerInfoData } from './CustomerInfo'

interface ReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
  order?: {
    id: string
    date: Date
    items: {
      name: string
      price: number
      quantity: number
      total: number
    }[]
    subtotal: number
    tax: number
    total: number
    paymentMethod: PaymentMethod
    paymentDetails?: PaymentDetails
    cashierName?: string
    customerInfo?: CustomerInfoData
  }
}

export default function Receipt({ open, onOpenChange, isLoading = false, order }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()

  const handlePrint = () => {
    // Only proceed if order is defined
    if (!order) return

    const printWindow = window.open('', '_blank')
    if (!printWindow || !receiptRef.current) return

    const receiptContent = receiptRef.current.innerHTML
    const appName = settings?.app_name || 'Elegant POS'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${appName} - Receipt #${order.id.slice(0, 8)}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              padding: 1rem;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 1rem;
            }
            .receipt-header h1 {
              font-size: 1.1rem;
              font-weight: bold;
              margin: 0;
            }
            .receipt-header p {
              margin: 0;
              font-size: 0.7rem;
              color: #666;
            }
            .receipt-header p.date-info {
              font-size: 0.8rem;
            }
            .receipt-items {
              margin: 1rem 0;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.5rem;
              font-size: 0.9rem;
            }
            .receipt-item-details {
              flex: 1;
            }
            .receipt-item-quantity {
              color: #666;
              font-size: 0.8rem;
            }
            .receipt-item-price {
              text-align: right;
              min-width: 60px;
            }
            .receipt-totals {
              margin-top: 1rem;
              font-size: 0.9rem;
            }
            .receipt-total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.25rem;
              font-weight: bold;
              font-size: 1.1rem;
            }
            .receipt-payment {
              margin-top: 1rem;
              font-size: 0.9rem;
            }
            .receipt-footer {
              margin-top: 2rem;
              text-align: center;
              font-size: 0.8rem;
              color: #666;
            }
            .separator {
              border-top: 1px dashed #ccc;
              margin: 1rem 0;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 0.5cm;
                size: 80mm 297mm;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.setTimeout(function() { window.close(); }, 500)">
          ${receiptContent}
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const formatPaymentMethod = (method: PaymentMethod): string => {
    if (!method) return 'Unknown';

    switch (method) {
      case 'cash':
        return 'Cash'
      case 'card':
        return 'Card'
      case 'mobile_payment':
        return 'Mobile Payment'
      case 'gift_card':
        return 'Gift Card'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        // For any other payment methods, convert snake_case to Title Case
        return method
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading receipt...' : order ? `Order #${order.id.slice(0, 8)}` : 'Receipt'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading receipt...</p>
          </div>
        ) : order ? (
          <ScrollArea className="max-h-[60vh]">
            <div ref={receiptRef} className="receipt-content p-4">
              <div className="receipt-header text-center mb-4">
                <h1 className="text-lg font-bold">{settings?.app_name || 'Elegant POS'}</h1>
                <p className="text-xs text-muted-foreground">{settings?.app_address || '123 Main Street, City'}</p>
                <p className="text-xs text-muted-foreground">Tel: {settings?.app_phone || '(123) 456-7890'}</p>
                {settings?.app_email && (
                  <p className="text-xs text-muted-foreground">Email: {settings.app_email}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2 date-info">
                  {formatDate(order.date)}
                </p>
                <p className="text-sm mt-1 date-info">Receipt #{order.id.slice(0, 8)}</p>
                {order.cashierName && (
                  <p className="text-sm text-muted-foreground mt-1 date-info">Cashier: {order.cashierName}</p>
                )}
                {order.customerInfo && (order.customerInfo.name || order.customerInfo.phone) && (
                  <div className="text-sm text-muted-foreground mt-1 date-info">
                    {order.customerInfo.name && <p>Customer: {order.customerInfo.name}</p>}
                    {order.customerInfo.phone && <p>Phone: {order.customerInfo.phone}</p>}
                  </div>
                )}
              </div>

            <Separator className="my-4" />

            <div className="receipt-items space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="receipt-item flex justify-between">
                  <div className="receipt-item-details">
                    <div>{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div className="receipt-item-price text-right">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="receipt-totals space-y-1">
              <div className="receipt-total-row flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="receipt-payment mt-4">
              <div className="font-medium">Payment Method</div>
              <div className="flex justify-between mt-1">
                <span>{formatPaymentMethod(order.paymentMethod)}</span>
                <span>{formatCurrency(order.total)}</span>
              </div>

              {order.paymentMethod === 'cash' && order.paymentDetails?.amount_tendered && (
                <>
                  <div className="flex justify-between mt-1 text-sm">
                    <span>Amount Tendered</span>
                    <span>{formatCurrency(order.paymentDetails.amount_tendered)}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-sm">
                    <span>Change</span>
                    <span>{formatCurrency(order.paymentDetails.change_due || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="receipt-footer mt-8 text-center text-sm text-muted-foreground">
              <p>Thank you for your purchase!</p>
              <p>Please come again</p>
            </div>
          </div>
        </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No receipt data available</p>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          {!isLoading && order && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
