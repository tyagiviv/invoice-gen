"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Info } from "lucide-react"
import { generateInvoice } from "@/app/actions/generate-invoice"
import { useActionState } from "react"

interface InvoiceItem {
  id: string
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

export default function InvoiceForm() {
  const [state, formAction, isPending] = useActionState(generateInvoice, null)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(1)

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", unitPrice: "", quantity: "", discount: "", total: "" },
  ])

  const [isPaid, setIsPaid] = useState(false)
  const [clientEmail, setClientEmail] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [regCode, setRegCode] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(getCurrentDate())
  const [dueDate, setDueDate] = useState(getDueDate())

  // Load next invoice number from API
  const loadNextInvoiceNumber = async () => {
    try {
      const response = await fetch("/api/invoice-number?" + Date.now()) // Add timestamp to prevent caching
      const data = await response.json()
      setNextInvoiceNumber(data.nextInvoiceNumber)
      console.log("📊 Loaded next invoice number:", data.nextInvoiceNumber)
    } catch (error) {
      console.error("Failed to load invoice number:", error)
      setNextInvoiceNumber(1)
    }
  }

  // Load invoice number on mount
  useEffect(() => {
    loadNextInvoiceNumber()
  }, [])

  // Reset form and update invoice number after successful generation
  useEffect(() => {
    if (state?.success && state?.shouldReset) {
      console.log("🔄 Resetting form after successful generation")
      resetForm()
      // Update the next invoice number from the response
      if (state.nextInvoiceNumber) {
        setNextInvoiceNumber(state.nextInvoiceNumber)
        console.log("📊 Updated next invoice number to:", state.nextInvoiceNumber)
      } else {
        loadNextInvoiceNumber()
      }
    }
  }, [state])

  // Handle paid status change - update due date automatically
  useEffect(() => {
    if (isPaid) {
      // If marked as paid, set due date to invoice date
      setDueDate(invoiceDate)
    } else {
      // If unmarked, set due date to 14 days from invoice date
      const invoiceDateObj = new Date(invoiceDate)
      invoiceDateObj.setDate(invoiceDateObj.getDate() + 14)
      setDueDate(invoiceDateObj.toISOString().split("T")[0])
    }
  }, [isPaid, invoiceDate])

  // Handle invoice date change - update due date accordingly
  const handleInvoiceDateChange = (newDate: string) => {
    setInvoiceDate(newDate)
    if (isPaid) {
      // If paid, due date should match invoice date
      setDueDate(newDate)
    } else {
      // If not paid, due date should be 14 days later
      const dateObj = new Date(newDate)
      dateObj.setDate(dateObj.getDate() + 14)
      setDueDate(dateObj.toISOString().split("T")[0])
    }
  }

  const resetForm = () => {
    console.log("🔄 Resetting form...")
    setItems([{ id: Date.now().toString(), description: "", unitPrice: "", quantity: "", discount: "", total: "" }])
    setIsPaid(false)
    setClientEmail("")
    setBuyerName("")
    setClientAddress("")
    setRegCode("")
    const currentDate = getCurrentDate()
    setInvoiceDate(currentDate)
    setDueDate(getDueDate())
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      unitPrice: "",
      quantity: "",
      discount: "",
      total: "",
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

          // Auto-calculate total when quantity, price, or discount changes
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
        <p className="text-center text-gray-600 mt-2">Next Invoice Number: #{nextInvoiceNumber}</p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientEmail">Client Email (for reference only)</Label>
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
                <span>Email will be saved but not sent automatically</span>
              </div>
            </div>
            <div>
              <Label htmlFor="buyerName">Buyer Name</Label>
              <Input
                id="buyerName"
                name="buyerName"
                placeholder="Enter buyer name or leave empty for 'ERAISIK'"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientAddress">Client Address</Label>
              <Input
                id="clientAddress"
                name="clientAddress"
                placeholder="Enter client address"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="regCode">Registration Code</Label>
              <Input
                id="regCode"
                name="regCode"
                placeholder="Enter registration code"
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
                onChange={(e) => handleInvoiceDateChange(e.target.value)}
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
                      name={`items[${index}].description`}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Service/Product description"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      name={`items[${index}].unitPrice`}
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      name={`items[${index}].quantity`}
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      name={`items[${index}].discount`}
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, "discount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input name={`items[${index}].total`} value={item.total} readOnly className="bg-gray-50" />
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
          <Button type="submit" disabled={isPending} className="w-full md:w-auto px-8 py-3">
            {isPending ? "Generating Invoice..." : "Generate Invoice"}
          </Button>
        </div>

        {/* Success/Error Messages */}
        {state?.success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{state.message}</p>
            {state.downloadUrl && (
              <a
                href={state.downloadUrl}
                download={`Invoice_${state.invoiceNumber}.pdf`}
                className="inline-block mt-2 text-green-600 hover:text-green-800 underline"
              >
                Download Invoice PDF
              </a>
            )}
          </div>
        )}

        {state?.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{state.message}</p>
          </div>
        )}
      </form>
    </div>
  )
}
