import { type NextRequest, NextResponse } from "next/server"
import { sendInvoiceEmailSimple } from "@/lib/email-sender-simple"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientEmail, invoiceNumber, customerName, source, pdfUrl } = body

    if (!recipientEmail || !invoiceNumber || !pdfUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Convert base64 PDF to buffer
    const base64Data = pdfUrl.replace("data:application/pdf;base64,", "")
    const pdfBuffer = Buffer.from(base64Data, "base64")

    // Send email
    const result = await sendInvoiceEmailSimple(
      recipientEmail,
      pdfBuffer,
      invoiceNumber,
      customerName,
      source || "manual",
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
