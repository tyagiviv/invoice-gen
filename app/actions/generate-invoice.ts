"use server"

import { generatePDF } from "@/lib/pdf-generator"

interface InvoiceItem {
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

// Simple server-side counter
let serverInvoiceCounter = 1

export async function generateInvoice(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const clientEmail = formData.get("clientEmail") as string
    const buyerName = (formData.get("buyerName") as string) || "ERAISIK"
    const clientAddress = formData.get("clientAddress") as string
    const regCode = formData.get("regCode") as string
    const invoiceDate = formData.get("invoiceDate") as string
    const dueDate = formData.get("dueDate") as string
    const isPaid = formData.get("isPaid") === "on"

    // Validate required fields
    if (!invoiceDate || !dueDate) {
      return {
        success: false,
        error: true,
        message: "Invoice date and due date are required",
      }
    }

    // Validate email if provided
    if (clientEmail && !isValidEmail(clientEmail)) {
      return {
        success: false,
        error: true,
        message: "Invalid email format",
      }
    }

    // Extract items
    const items: InvoiceItem[] = []
    let itemIndex = 0

    while (formData.get(`items[${itemIndex}].description`) !== null) {
      const description = formData.get(`items[${itemIndex}].description`) as string
      const unitPrice = formData.get(`items[${itemIndex}].unitPrice`) as string
      const quantity = formData.get(`items[${itemIndex}].quantity`) as string
      const discount = formData.get(`items[${itemIndex}].discount`) as string
      const total = formData.get(`items[${itemIndex}].total`) as string

      if (description.trim()) {
        items.push({
          description: description.trim(),
          unitPrice: unitPrice || "0",
          quantity: quantity || "1",
          discount: discount || "0",
          total: total || "0",
        })
      }
      itemIndex++
    }

    if (items.length === 0) {
      return {
        success: false,
        error: true,
        message: "At least one item is required",
      }
    }

    // Get next invoice number
    const invoiceNumber = serverInvoiceCounter++

    // Generate PDF
    const pdfBuffer = await generatePDF({
      invoiceNumber,
      clientEmail,
      buyerName,
      clientAddress,
      regCode,
      invoiceDate,
      dueDate,
      isPaid,
      items,
    })

    // Create download URL
    const base64PDF = pdfBuffer.toString("base64")
    const downloadUrl = `data:application/pdf;base64,${base64PDF}`

    let message = `Invoice #${invoiceNumber} created successfully!`
    if (clientEmail && clientEmail.trim()) {
      message = `Invoice #${invoiceNumber} created successfully! Download the PDF and send it manually to ${clientEmail} for now.`
    }

    return {
      success: true,
      error: false,
      message,
      downloadUrl,
      invoiceNumber,
      emailSent: false,
      shouldReset: true,
      nextInvoiceNumber: serverInvoiceCounter, // Send next number for UI update
    }
  } catch (error) {
    console.error("Error generating invoice:", error)
    return {
      success: false,
      error: true,
      message: `Failed to generate invoice: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
  return pattern.test(email)
}
