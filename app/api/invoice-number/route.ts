import { NextResponse } from "next/server"

// Simple server-side counter
let invoiceCounter = 1

export async function GET() {
  try {
    return NextResponse.json({ nextInvoiceNumber: invoiceCounter })
  } catch (error) {
    console.error("Error getting invoice number:", error)
    return NextResponse.json({ nextInvoiceNumber: 1 })
  }
}

export async function POST(request: Request) {
  try {
    const { invoiceNumber } = await request.json()
    invoiceCounter = invoiceNumber + 1
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving invoice number:", error)
    return NextResponse.json({ success: false })
  }
}
