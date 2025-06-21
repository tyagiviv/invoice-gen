"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Info } from "lucide-react"

interface InvoiceItem {
  id: string
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

interface ApiResponse {
  success: boolean
  error: boolean
  message: string
  downloadUrl?: string
  invoiceNumber?: number
  nextInvoiceNumber?: number
}

export default function InvoiceForm() {
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null)

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", unitPrice: "", quantity: "1", discount: "0", total: "0" },
  ])

  const [isPaid, setIsPaid] = useState(false)
  const [clientEmail, setClientEmail] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [regCode, setRegCode] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(getCurrentDate())
  const [dueDate, setDueDate] = useState(getDueDate())

  // Load next invoice number
  const loadNextInvoiceNumber = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("📊 Loading invoice number...")

      const response = await fetch("/api/generate-invoice", {
        method: "GET",
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        setNextInvoiceNumber(data.nextInvoiceNumber)
        console.log("📊 Loaded invoice number:", data.nextInvoiceNumber)
      }
    } catch (error) {
      console.error("Failed to load invoice number:", error)
      setNextInvoiceNumber(1)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadNextInvoiceNumber()
  }, [loadNextInvoiceNumber])

  // Handle paid status change
  useEffect(() => {
    if (isPaid) {
      setDueDate(invoiceDate)
    } else {
      const date = new Date(invoiceDate)
      date.setDate(date.getDate() + 14)
      setDueDate(date.toISOString().split("T")[0])
    }
  }, [isPaid, invoiceDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setLastResponse(null)

    try {
      console.log("🚀 Submitting form...")

      // Validate form
      if (!invoiceDate || !dueDate) {
        setLastResponse({
          success: false,
          error: true,
          message: "Invoice date and due date are required",
        })
        return
      }

      const validItems = items.filter((item) => item.description.trim())
      if (validItems.length === 0) {
        setLastResponse({
          success: false,
          error: true,
          message: "At least one item is required",
        })
        return
      }

      // Prepare data
      const requestData = {
        clientEmail,
        buyerName: buyerName || "ERAISIK",
        clientAddress,
        regCode,
        invoiceDate,
        dueDate,
        isPaid,
        items: validItems.map((item) => ({
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount,
          total: item.total,
        })),
      }

      console.log("📤 Sending request with", validItems.length, "items")

      // Make API call
      const response = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const data: ApiResponse = await response.json()
      console.log("📥 Received response:", { success: data.success, hasDownload: !!data.downloadUrl })

      setLastResponse(data)

      if (data.success) {
        // Reset form on success
        resetForm()
        // Update next invoice number
        if (data.nextInvoiceNumber) {
          setNextInvoiceNumber(data.nextInvoiceNumber)
        } else {
          // Fallback: reload from API
          setTimeout(loadNextInvoiceNumber, 500)
        }
      }
    } catch (error) {
      console.error("❌ Form submission error:", error)
      setLastResponse({
        success: false,
        error: true,
        message: error instanceof Error ? error.message : "Network error occurred",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    console.log("🔄 Resetting form...")
    setItems([
      {
        id: Date.now().toString(),
        description: "",
        unitPrice: "",
        quantity: "1",
        discount: "0",
        total: "0",
      },
    ])
    setIsPaid(false)
    setClientEmail("")
    setBuyerName("")
    setClientAddress("")
    setRegCode("")
    setInvoiceDate(getCurrentDate())
    setDueDate(getDueDate())
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      unitPrice: "",
      quantity: "1",
      discount: "0",
      total: "0",
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Auto-calculate total
          if (field === "quantity" || field === "unitPrice" || field === "discount") {
            const qty = Number.parseFloat(updatedItem.quantity) || 1
            const price = Number.parseFloat(updatedItem.unitPrice) || 0
            const discount = Number.parseFloat(updatedItem.discount) || 0
            const total = qty * price * (1 - discount / 100)
            updatedItem.total = total.toFixed(2)
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  function getCurrentDate() {
    return new Date().toISOString().split("T")[0]
  }

  function getDueDate() {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split("T")[0]
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center">Invoice Generator</h1>
        <p className="text-center text-gray-600 mt-2">
          Next Invoice Number: #{isLoading ? "..." : nextInvoiceNumber}
          <span className="text-xs text-green-500 ml-2">(API Mode)</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientEmail">Client Email (optional)</Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <div className="flex items-center mt-1 text-sm text-blue-600">
                <Info className="h-4 w-4 mr-1" />
                <span>For reference only - not sent automatically</span>
              </div>
            </div>
            <div>
              <Label htmlFor="buyerName">Buyer Name</Label>
              <Input
                id="buyerName"
                name="buyerName"
                placeholder="Leave empty for 'ERAISIK'"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientAddress">Client Address</Label>
              <Input
                id="clientAddress"
                name="clientAddress"
                placeholder="Client address"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="regCode">Registration Code</Label>
              <Input
                id="regCode"
                name="regCode"
                placeholder="Registration code"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                name="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPaid"
                name="isPaid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(checked as boolean)}
              />
              <Label htmlFor="isPaid">Mark as Paid</Label>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Headers */}
              <div className="grid grid-cols-12 gap-2 font-semibold text-sm text-gray-600">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Discount (%)</div>
                <div className="col-span-2">Total</div>
              </div>

              {/* Items */}
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Service/Product description"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, "discount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input value={item.total} readOnly className="bg-gray-50" />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button type="submit" disabled={isGenerating || isLoading} className="w-full md:w-auto px-8 py-3">
            {isGenerating ? "Generating Invoice..." : "Generate Invoice"}
          </Button>
        </div>

        {/* Messages */}
        {lastResponse?.success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{lastResponse.message}</p>
            {lastResponse.downloadUrl && (
              <a
                href={lastResponse.downloadUrl}
                download={`Invoice_${lastResponse.invoiceNumber}.pdf`}
                className="inline-block mt-2 text-green-600 hover:text-green-800 underline"
              >
                Download Invoice PDF
              </a>
            )}
          </div>
        )}

        {lastResponse?.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{lastResponse.message}</p>
          </div>
        )}
      </form>
    </div>
  )
}
