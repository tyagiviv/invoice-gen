import { NextResponse } from "next/server"
import { getCurrentInvoiceNumber } from "@/app/actions/generate-invoice"

export async function GET() {
  try {
    const nextInvoiceNumber = await getCurrentInvoiceNumber()

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
