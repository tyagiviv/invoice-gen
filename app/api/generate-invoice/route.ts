import { type NextRequest, NextResponse } from "next/server"
import { generatePDF } from "@/lib/pdf-generator"

interface InvoiceItem {
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

// Simple global counter for development
let globalInvoiceCounter = 1

export async function POST(request: NextRequest) {
  console.log("🚀 API route called at:", new Date().toISOString())

  try {
    const body = await request.json()
    console.log("📝 Request body received:", Object.keys(body))

    const {
      clientEmail = "",
      buyerName = "ERAISIK",
      clientAddress = "",
      regCode = "",
      invoiceDate,
      dueDate,
      isPaid = false,
      items = [],
    } = body

    // Validate required fields
    if (!invoiceDate || !dueDate) {
      console.log("❌ Missing required dates")
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Invoice date and due date are required",
        },
        { status: 400 },
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.log("❌ No items found")
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "At least one item is required",
        },
        { status: 400 },
      )
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

    return NextResponse.json({
      success: true,
      error: false,
      message,
      downloadUrl,
      invoiceNumber: currentInvoiceNumber,
      nextInvoiceNumber: globalInvoiceCounter,
    })
  } catch (error) {
    console.error("❌ API route error:", error)

    // Rollback counter on error
    if (globalInvoiceCounter > 1) {
      globalInvoiceCounter--
    }

    return NextResponse.json(
      {
        success: false,
        error: true,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Helper function to get current counter
export async function GET() {
  return NextResponse.json({
    nextInvoiceNumber: globalInvoiceCounter,
    timestamp: Date.now(),
  })
}
