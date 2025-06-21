import fs from "fs/promises"
import path from "path"

const INVOICE_NUMBER_FILE = path.join(process.cwd(), "data", "invoice_number.json")

export async function getNextInvoiceNumber(): Promise<number> {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(INVOICE_NUMBER_FILE), { recursive: true })

    // Try to read existing file
    const data = await fs.readFile(INVOICE_NUMBER_FILE, "utf-8")
    const { invoice_number } = JSON.parse(data)
    return invoice_number + 1
  } catch (error) {
    // File doesn't exist, start with 1
    return 1
  }
}

export async function saveInvoiceNumber(invoiceNumber: number): Promise<void> {
  await fs.mkdir(path.dirname(INVOICE_NUMBER_FILE), { recursive: true })
  await fs.writeFile(INVOICE_NUMBER_FILE, JSON.stringify({ invoice_number: invoiceNumber }, null, 2))
}
