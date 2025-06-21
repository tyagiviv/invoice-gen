import { NextResponse } from "next/server"
import { getNextInvoiceNumber } from "@/lib/invoice-number"

export async function GET() {
  try {
    const nextNumber = await getNextInvoiceNumber()
    return NextResponse.json({ nextInvoiceNumber: nextNumber })
  } catch (error) {
    console.error("Error getting invoice number:", error)
    return NextResponse.json({ nextInvoiceNumber: 1 })
  }
}
