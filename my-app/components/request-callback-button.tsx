"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PhoneCall } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function RequestCallbackButton() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/request_call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request callback')
      }

      toast.success("Callback Requested", {
        description: "We'll call you shortly. Please keep your phone nearby.",
      })
      setIsOpen(false)
      setPhoneNumber("")
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to request callback",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all"
          >
            <PhoneCall className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Callback</DialogTitle>
            <DialogDescription>
              Enter your phone number and we&apos;ll call you back shortly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestCallback} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                pattern="^\+[1-9]\d{1,14}$"
                title="Please enter a valid phone number with country code (e.g., +1234567890)"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Requesting..." : "Request Callback"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 