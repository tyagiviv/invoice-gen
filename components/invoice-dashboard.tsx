"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, FileText, Euro } from "lucide-react"
import Link from "next/link"

interface InvoiceRecord {
  id: number
  invoiceNumber: number
  clientEmail?: string
  buyerName: string
  clientAddress: string
  regCode: string
  invoiceDate: string
  dueDate: string
  isPaid: boolean
  totalAmount: number
  createdAt: string
  items: Array<{
    description: string
    unitPrice: string
    quantity: string
    discount: string
    total: string
  }>
}

interface DatabaseStats {
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  lastInvoiceNumber: number
}

export default function InvoiceDashboard() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/invoices")
      const data = await response.json()

      if (data.success) {
        setInvoices(data.invoices)
        setStats(data.stats)
        setError(null)
      } else {
        setError(data.error || "Failed to load invoices")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error loading invoices:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaidStatus = async (invoiceNumber: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPaid: !currentStatus }),
      })

      if (response.ok) {
        await loadInvoices() // Reload data
      }
    } catch (err) {
      console.error("Error updating invoice:", err)
    }
  }

  const deleteInvoice = async (invoiceNumber: number) => {
    if (!confirm(`Are you sure you want to delete Invoice #${invoiceNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceNumber}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadInvoices() // Reload data
      }
    } catch (err) {
      console.error("Error deleting invoice:", err)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
  }

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading invoices...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">Error: {error}</div>
        <div className="text-center mt-4">
          <Button onClick={loadInvoices}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your invoices and track payments</p>
        </div>
        <Link href="/">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Create New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Last: #{stats.lastInvoiceNumber}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">All invoices combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <Euro className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
              <p className="text-xs text-muted-foreground">{stats.paidInvoices} invoices paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Amount</CardTitle>
              <Euro className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.unpaidAmount)}</div>
              <p className="text-xs text-muted-foreground">{stats.unpaidInvoices} invoices pending</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No invoices found</p>
              <Link href="/">
                <Button className="mt-4">Create Your First Invoice</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">#{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.buyerName}</div>
                        {invoice.clientEmail && <div className="text-sm text-gray-500">{invoice.clientEmail}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={invoice.isPaid ? "default" : "secondary"}
                        className={invoice.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {invoice.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePaidStatus(invoice.invoiceNumber, invoice.isPaid)}
                        >
                          {invoice.isPaid ? "Mark Unpaid" : "Mark Paid"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteInvoice(invoice.invoiceNumber)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
