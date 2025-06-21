import { type NextRequest, NextResponse } from "next/server"
import { generatePDF } from "@/lib/pdf-generator"
import { getNextInvoiceNumber, saveInvoice } from "@/lib/invoice-database"

interface InvoiceItem {
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

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

    // Get current invoice number from database
    const currentInvoiceNumber = getNextInvoiceNumber()
    console.log("📄 Generating invoice #", currentInvoiceNumber)

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: InvoiceItem) => {
      return sum + Number.parseFloat(item.total || "0")
    }, 0)

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

    // Save invoice to database
    const savedInvoice = saveInvoice({
      invoiceNumber: currentInvoiceNumber,
      clientEmail,
      buyerName,
      clientAddress,
      regCode,
      invoiceDate,
      dueDate,
      isPaid,
      items,
      totalAmount,
    })

    console.log("💾 Invoice saved to database with ID:", savedInvoice.id)

    // Create download URL
    const base64PDF = pdfBuffer.toString("base64")
    const downloadUrl = `data:application/pdf;base64,${base64PDF}`

    let message = clientEmail
      ? `Invoice #${currentInvoiceNumber} created! Download and send to ${clientEmail}`
      : `Invoice #${currentInvoiceNumber} created successfully!`

    // 📧 NEW: Send email if email address is provided
    if (clientEmail && clientEmail.trim()) {
      console.log("📧 Sending invoice email to:", clientEmail)

      try {
        // Import the secure email sender
        const { sendInvoiceEmailSecure } = await import("@/lib/email-sender-secure")

        const emailResult = await sendInvoiceEmailSecure(
          clientEmail,
          pdfBuffer,
          currentInvoiceNumber,
          buyerName,
          "manual", // This is from manual form submission
        )

        if (emailResult.success) {
          console.log("✅ Email sent successfully to:", emailResult.sentTo)
          message = `Invoice #${currentInvoiceNumber} created and emailed to ${clientEmail}!`
        } else {
          console.log("⚠️ Email sending failed:", emailResult.message)
          message = `Invoice #${currentInvoiceNumber} created! Email sending failed: ${emailResult.message}`
        }
      } catch (emailError) {
        console.error("❌ Email error:", emailError)
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown email error"
        message = `Invoice #${currentInvoiceNumber} created! Email error: ${errorMessage}`
      }
    }

    console.log("✅ Invoice generation completed")

    return NextResponse.json({
      success: true,
      error: false,
      message,
      downloadUrl,
      invoiceNumber: currentInvoiceNumber,
      nextInvoiceNumber: getNextInvoiceNumber(),
      savedInvoice: {
        id: savedInvoice.id,
        totalAmount: savedInvoice.totalAmount,
        createdAt: savedInvoice.createdAt,
      },
    })
  } catch (error) {
    console.error("❌ API route error:", error)

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

// Get current invoice number
export async function GET() {
  try {
    const nextInvoiceNumber = getNextInvoiceNumber()
    return NextResponse.json({
      nextInvoiceNumber,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error getting invoice number:", error)
    return NextResponse.json({
      nextInvoiceNumber: 1,
      error: true,
    })
  }
}
