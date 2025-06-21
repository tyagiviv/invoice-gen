import { NextResponse } from "next/server"
import { getAllInvoices, getDatabaseStats } from "@/lib/invoice-database"

export async function GET() {
  try {
    const invoices = getAllInvoices()
    const stats = getDatabaseStats()

    return NextResponse.json({
      success: true,
      invoices,
      stats,
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoices",
      },
      { status: 500 },
    )
  }
}
