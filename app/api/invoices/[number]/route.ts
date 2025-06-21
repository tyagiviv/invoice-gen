import { type NextRequest, NextResponse } from "next/server"
import { getInvoiceByNumber, updateInvoice, deleteInvoice } from "@/lib/invoice-database"

export async function GET(request: NextRequest, { params }: { params: { number: string } }) {
  try {
    const invoiceNumber = Number.parseInt(params.number)
    const invoice = getInvoiceByNumber(invoiceNumber)

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { number: string } }) {
  try {
    const invoiceNumber = Number.parseInt(params.number)
    const updates = await request.json()

    const updatedInvoice = updateInvoice(invoiceNumber, updates)

    if (!updatedInvoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { number: string } }) {
  try {
    const invoiceNumber = Number.parseInt(params.number)
    const deleted = deleteInvoice(invoiceNumber)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Invoice #${invoiceNumber} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to delete invoice" }, { status: 500 })
  }
}
