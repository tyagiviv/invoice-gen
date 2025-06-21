import { NextResponse } from "next/server"

export async function GET() {
  try {
    // This will now use the same counter as the generate-invoice API
    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/generate-invoice`, {
      method: "GET",
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({
      nextInvoiceNumber: 1,
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
