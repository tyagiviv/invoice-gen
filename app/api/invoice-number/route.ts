import { NextResponse } from "next/server"
import { getNextInvoiceNumber } from "@/lib/invoice-storage"

export async function GET() {
  try {
    const nextInvoiceNumber = await getNextInvoiceNumber()
    return NextResponse.json({ nextInvoiceNumber })
  } catch (error) {
    console.error("Error getting invoice number:", error)
    return NextResponse.json({ nextInvoiceNumber: 1 })
  }
}
