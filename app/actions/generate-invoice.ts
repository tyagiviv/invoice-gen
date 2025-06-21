"use server"

import { generatePDF } from "@/lib/pdf-generator"
import { revalidatePath } from "next/cache"

interface InvoiceItem {
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

// Simple global counter - will reset on server restart but that's fine for now
let globalInvoiceCounter = 1

export async function generateInvoice(prevState: any, formData: FormData) {
  console.log("🚀 Server action called, counter:", globalInvoiceCounter)

  try {
    // Extract and validate form data
    const clientEmail = formData.get("clientEmail")?.toString() || ""
    const buyerName = formData.get("buyerName")?.toString() || "ERAISIK"
    const clientAddress = formData.get("clientAddress")?.toString() || ""
    const regCode = formData.get("regCode")?.toString() || ""
    const invoiceDate = formData.get("invoiceDate")?.toString()
    const dueDate = formData.get("dueDate")?.toString()
    const isPaid = formData.get("isPaid") === "on"

    console.log("📝 Form data extracted:", { buyerName, invoiceDate, dueDate, isPaid })

    // Basic validation
    if (!invoiceDate || !dueDate) {
      console.log("❌ Missing required dates")
      return {
        success: false,
        error: true,
        message: "Invoice date and due date are required",
        timestamp: Date.now(),
      }
    }

    // Extract items
    const items: InvoiceItem[] = []
    let itemIndex = 0

    while (true) {
      const description = formData.get(`items[${itemIndex}].description`)?.toString()
      if (!description) break

      const unitPrice = formData.get(`items[${itemIndex}].unitPrice`)?.toString() || "0"
      const quantity = formData.get(`items[${itemIndex}].quantity`)?.toString() || "1"
      const discount = formData.get(`items[${itemIndex}].discount`)?.toString() || "0"
      const total = formData.get(`items[${itemIndex}].total`)?.toString() || "0"

      if (description.trim()) {
        items.push({
          description: description.trim(),
          unitPrice,
          quantity,
          discount,
          total,
        })
      }
      itemIndex++
    }

    console.log("📦 Items extracted:", items.length)

    if (items.length === 0) {
      console.log("❌ No items found")
      return {
        success: false,
        error: true,
        message: "At least one item is required",
        timestamp: Date.now(),
      }
    }

    // Get current invoice number and increment
    const currentInvoiceNumber = globalInvoiceCounter
    globalInvoiceCounter++

    console.log("📄 Generating invoice #", currentInvoiceNumber)

    // Generate PDF
    const pdfBuffer = await generatePDF({
      invoiceNumber: currentInvoiceNumber,
      clientEmail,
      buyerName,
      clientAddress,
      regCode,
      invoiceDate,
      dueDate,
      isPaid,
      items,
    })

    console.log("✅ PDF generated successfully, size:", pdfBuffer.length)

    // Create download URL
    const base64PDF = pdfBuffer.toString("base64")
    const downloadUrl = `data:application/pdf;base64,${base64PDF}`

    const message = clientEmail
      ? `Invoice #${currentInvoiceNumber} created! Download and send to ${clientEmail}`
      : `Invoice #${currentInvoiceNumber} created successfully!`

    console.log("✅ Invoice generation completed")

    // Revalidate to ensure fresh state
    revalidatePath("/")

    return {
      success: true,
      error: false,
      message,
      downloadUrl,
      invoiceNumber: currentInvoiceNumber,
      nextInvoiceNumber: globalInvoiceCounter,
      shouldReset: true,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("❌ Server action error:", error)

    // Rollback counter on error
    if (globalInvoiceCounter > 1) {
      globalInvoiceCounter--
    }

    // Return a safe error response
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: Date.now(),
    }
  }
}

// Helper function to get current counter
export async function getCurrentInvoiceNumber() {
  return globalInvoiceCounter
}
