"use server"

import { generatePDF } from "@/lib/pdf-generator"

interface InvoiceItem {
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

// Use a more persistent counter approach for development
const getInvoiceCounter = () => {
  if (typeof globalThis !== "undefined") {
    if (!globalThis.__invoiceCounter) {
      globalThis.__invoiceCounter = 1
    }
    return globalThis.__invoiceCounter
  }
  return 1
}

const setInvoiceCounter = (value: number) => {
  if (typeof globalThis !== "undefined") {
    globalThis.__invoiceCounter = value
  }
}

export async function generateInvoice(prevState: any, formData: FormData) {
  console.log("🚀 Server action called at:", new Date().toISOString())

  try {
    // Add a small delay to prevent race conditions in development
    if (process.env.NODE_ENV === "development") {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Extract form data with better error handling
    const extractFormData = () => {
      try {
        return {
          clientEmail: formData.get("clientEmail")?.toString() || "",
          buyerName: formData.get("buyerName")?.toString() || "ERAISIK",
          clientAddress: formData.get("clientAddress")?.toString() || "",
          regCode: formData.get("regCode")?.toString() || "",
          invoiceDate: formData.get("invoiceDate")?.toString(),
          dueDate: formData.get("dueDate")?.toString(),
          isPaid: formData.get("isPaid") === "on",
        }
      } catch (error) {
        console.error("Error extracting form data:", error)
        throw new Error("Invalid form data")
      }
    }

    const data = extractFormData()
    console.log("📝 Form data extracted:", {
      buyerName: data.buyerName,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
    })

    // Validate required fields
    if (!data.invoiceDate || !data.dueDate) {
      console.log("❌ Missing required dates")
      return {
        success: false,
        error: true,
        message: "Invoice date and due date are required",
        timestamp: Date.now(),
      }
    }

    // Extract items with better error handling
    const extractItems = (): InvoiceItem[] => {
      const items: InvoiceItem[] = []
      let itemIndex = 0

      try {
        while (itemIndex < 50) {
          // Safety limit
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
      } catch (error) {
        console.error("Error extracting items:", error)
        throw new Error("Invalid item data")
      }

      return items
    }

    const items = extractItems()
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

    // Get and increment invoice number atomically
    const currentInvoiceNumber = getInvoiceCounter()
    setInvoiceCounter(currentInvoiceNumber + 1)

    console.log("📄 Generating invoice #", currentInvoiceNumber)

    // Generate PDF with timeout protection
    const generatePDFWithTimeout = async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("PDF generation timeout")), 30000)
      })

      const pdfPromise = generatePDF({
        invoiceNumber: currentInvoiceNumber,
        clientEmail: data.clientEmail,
        buyerName: data.buyerName,
        clientAddress: data.clientAddress,
        regCode: data.regCode,
        invoiceDate: data.invoiceDate!,
        dueDate: data.dueDate!,
        isPaid: data.isPaid,
        items,
      })

      return Promise.race([pdfPromise, timeoutPromise])
    }

    const pdfBuffer = await generatePDFWithTimeout()
    console.log("✅ PDF generated successfully, size:", pdfBuffer.length)

    // Create download URL
    const base64PDF = pdfBuffer.toString("base64")
    const downloadUrl = `data:application/pdf;base64,${base64PDF}`

    let message = data.clientEmail
      ? `Invoice #${currentInvoiceNumber} created! Download and send to ${data.clientEmail}`
      : `Invoice #${currentInvoiceNumber} created successfully!`

    // Send email if email address is provided
    if (data.clientEmail && data.clientEmail.trim()) {
      console.log("📧 Sending invoice email to:", data.clientEmail)

      try {
        const { sendInvoiceEmailSimple } = await import("@/lib/email-sender-simple")
        const emailResult = await sendInvoiceEmailSimple(
          data.clientEmail,
          pdfBuffer,
          currentInvoiceNumber,
          data.buyerName,
          "manual",
        )

        if (emailResult.success) {
          console.log("✅ Email sent successfully")
          message = `Invoice #${currentInvoiceNumber} created and emailed to ${data.clientEmail}!`
        } else {
          console.log("⚠️ Email sending failed:", emailResult.message)
          message = `Invoice #${currentInvoiceNumber} created! Email sending failed: ${emailResult.message}`
        }
      } catch (emailError) {
        console.error("❌ Email error:", emailError)
        message = `Invoice #${currentInvoiceNumber} created! Email error: ${emailError.message}`
      }
    } else {
      message = `Invoice #${currentInvoiceNumber} created successfully!`
    }

    console.log("✅ Invoice generation completed successfully")

    // Return success response
    const response = {
      success: true,
      error: false,
      message,
      downloadUrl,
      invoiceNumber: currentInvoiceNumber,
      nextInvoiceNumber: getInvoiceCounter(),
      shouldReset: true,
      timestamp: Date.now(),
    }

    console.log("📤 Returning response:", {
      success: response.success,
      invoiceNumber: response.invoiceNumber,
      nextInvoiceNumber: response.nextInvoiceNumber,
    })

    return response
  } catch (error) {
    console.error("❌ Server action error:", error)

    // Rollback counter on error
    const currentCounter = getInvoiceCounter()
    if (currentCounter > 1) {
      setInvoiceCounter(currentCounter - 1)
    }

    // Return safe error response
    const errorResponse = {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: Date.now(),
    }

    console.log("📤 Returning error response:", errorResponse)
    return errorResponse
  }
}

// Helper function to get current counter
export async function getCurrentInvoiceNumber() {
  return getInvoiceCounter()
}

// Add global type declaration
declare global {
  var __invoiceCounter: number | undefined
}
