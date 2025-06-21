import { NextResponse } from "next/server"

// Simple server-side counter that matches the action
let apiInvoiceCounter = 1

export async function GET() {
  try {
    return NextResponse.json({
      nextInvoiceNumber: apiInvoiceCounter,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error getting invoice number:", error)
    return NextResponse.json({ nextInvoiceNumber: 1 })
  }
}

export async function POST(request: Request) {
  try {
    const { invoiceNumber } = await request.json()
    apiInvoiceCounter = invoiceNumber + 1
    return NextResponse.json({
      success: true,
      nextInvoiceNumber: apiInvoiceCounter,
    })
  } catch (error) {
    console.error("Error saving invoice number:", error)
    return NextResponse.json({ success: false })
  }
}
