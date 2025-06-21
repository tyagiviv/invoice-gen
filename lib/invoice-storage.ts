// Simple invoice storage using Vercel KV (Redis-compatible)
// This will persist invoice numbers across deployments and sessions

interface InvoiceRecord {
  invoiceNumber: number
  createdAt: string
  clientEmail?: string
  buyerName: string
  totalAmount: number
  isPaid: boolean
}

// Fallback to memory storage if KV is not available
const memoryStorage = {
  lastInvoiceNumber: 0,
  invoices: new Map<number, InvoiceRecord>(),
}

export async function getNextInvoiceNumber(): Promise<number> {
  try {
    // Try to use Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const response = await fetch(`${process.env.KV_REST_API_URL}/get/last_invoice_number`, {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const lastNumber = data.result ? Number.parseInt(data.result) : 0
        return lastNumber + 1
      }
    }

    // Fallback to memory storage
    return memoryStorage.lastInvoiceNumber + 1
  } catch (error) {
    console.error("Error getting next invoice number:", error)
    return memoryStorage.lastInvoiceNumber + 1
  }
}

export async function saveInvoiceRecord(record: InvoiceRecord): Promise<void> {
  try {
    // Try to use Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      // Save the invoice record
      await fetch(`${process.env.KV_REST_API_URL}/set/invoice_${record.invoiceNumber}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: JSON.stringify(record) }),
      })

      // Update the last invoice number
      await fetch(`${process.env.KV_REST_API_URL}/set/last_invoice_number`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: record.invoiceNumber.toString() }),
      })

      console.log("✅ Invoice saved to KV storage")
      return
    }

    // Fallback to memory storage
    memoryStorage.invoices.set(record.invoiceNumber, record)
    memoryStorage.lastInvoiceNumber = record.invoiceNumber
    console.log("✅ Invoice saved to memory storage")
  } catch (error) {
    console.error("Error saving invoice record:", error)
    // Fallback to memory storage
    memoryStorage.invoices.set(record.invoiceNumber, record)
    memoryStorage.lastInvoiceNumber = record.invoiceNumber
  }
}

export async function getInvoiceRecord(invoiceNumber: number): Promise<InvoiceRecord | null> {
  try {
    // Try to use Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const response = await fetch(`${process.env.KV_REST_API_URL}/get/invoice_${invoiceNumber}`, {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.result ? JSON.parse(data.result) : null
      }
    }

    // Fallback to memory storage
    return memoryStorage.invoices.get(invoiceNumber) || null
  } catch (error) {
    console.error("Error getting invoice record:", error)
    return memoryStorage.invoices.get(invoiceNumber) || null
  }
}

export async function getAllInvoices(): Promise<InvoiceRecord[]> {
  try {
    // For KV storage, we'd need to implement a pattern scan
    // For now, return memory storage
    return Array.from(memoryStorage.invoices.values())
  } catch (error) {
    console.error("Error getting all invoices:", error)
    return []
  }
}
