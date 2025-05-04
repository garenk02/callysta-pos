'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Phone } from 'lucide-react'

export interface CustomerInfoData {
  name: string
  phone: string
}

interface CustomerInfoProps {
  customerInfo: CustomerInfoData
  onChange: (info: CustomerInfoData) => void
  disabled?: boolean
  isCompact?: boolean
}

export default function CustomerInfo({
  customerInfo,
  onChange,
  disabled = false,
  isCompact = false
}: CustomerInfoProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...customerInfo,
      name: e.target.value
    })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and basic phone formatting characters
    const value = e.target.value.replace(/[^\d+\-\s()]/g, '')
    onChange({
      ...customerInfo,
      phone: value
    })
  }

  return (
    <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
      {isCompact ? (
        /* Compact layout for desktop */
        <>
          <div className="flex gap-1">
            <div className="w-1/2">
              <div className="flex items-center">
                <Label htmlFor="customer-name" className="text-xs whitespace-nowrap mr-1">Name:</Label>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <Input
                    id="customer-name"
                    type="text"
                    placeholder="Customer name"
                    value={customerInfo.name}
                    onChange={handleNameChange}
                    disabled={disabled}
                    className="h-7 text-xs pl-6 pr-1"
                  />
                </div>
              </div>
            </div>
            <div className="w-1/2">
              <div className="flex items-center">
                <Label htmlFor="customer-phone" className="text-xs whitespace-nowrap mr-1">Phone:</Label>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <Input
                    id="customer-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone number"
                    value={customerInfo.phone}
                    onChange={handlePhoneChange}
                    disabled={disabled}
                    className="h-7 text-xs pl-6 pr-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Original layout for mobile */
        <>
          <div>
            <Label htmlFor="customer-name" className="text-xs block mb-0.5">Customer Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter customer name"
                value={customerInfo.name}
                onChange={handleNameChange}
                disabled={disabled}
                className="h-8 text-xs pl-8 pr-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customer-phone" className="text-xs block mb-0.5">Phone Number</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                placeholder="Enter phone number"
                value={customerInfo.phone}
                onChange={handlePhoneChange}
                disabled={disabled}
                className="h-8 text-xs pl-8 pr-2"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
