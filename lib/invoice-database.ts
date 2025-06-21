import { writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"

interface InvoiceRecord {
  id: number
  invoiceNumber: number
  clientEmail?: string
  buyerName: string
  clientAddress: string
  regCode: string
  invoiceDate: string
  dueDate: string
  isPaid: boolean
  items: Array<{
    description: string
    unitPrice: string
    quantity: string
    discount: string
    total: string
  }>
  totalAmount: number
  createdAt: string
  pdfPath?: string
}

interface DatabaseSchema {
  invoices: InvoiceRecord[]
  lastInvoiceNumber: number
}

const DB_PATH = join(process.cwd(), "data", "invoices.json")

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = join(process.cwd(), "data")
  if (!existsSync(dataDir)) {
    const { mkdirSync } = require("fs")
    mkdirSync(dataDir, { recursive: true })
  }
}

// Initialize database if it doesn't exist
function initializeDatabase(): DatabaseSchema {
  const initialData: DatabaseSchema = {
    invoices: [],
    lastInvoiceNumber: 0,
  }

  ensureDataDirectory()
  writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2))
  return initialData
}

// Read database
function readDatabase(): DatabaseSchema {
  try {
    if (!existsSync(DB_PATH)) {
      return initializeDatabase()
    }

    const data = readFileSync(DB_PATH, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading database:", error)
    return initializeDatabase()
  }
}

// Write database
function writeDatabase(data: DatabaseSchema): void {
  try {
    ensureDataDirectory()
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error("Error writing database:", error)
    throw error
  }
}

// Get next invoice number
export function getNextInvoiceNumber(): number {
  const db = readDatabase()
  return db.lastInvoiceNumber + 1
}

// Save invoice to database
export function saveInvoice(invoiceData: Omit<InvoiceRecord, "id" | "createdAt">): InvoiceRecord {
  const db = readDatabase()

  const newInvoice: InvoiceRecord = {
    ...invoiceData,
    id: Date.now(), // Simple ID generation
    createdAt: new Date().toISOString(),
  }

  db.invoices.push(newInvoice)
  db.lastInvoiceNumber = invoiceData.invoiceNumber

  writeDatabase(db)
  return newInvoice
}

// Get all invoices
export function getAllInvoices(): InvoiceRecord[] {
  const db = readDatabase()
  return db.invoices.sort((a, b) => b.invoiceNumber - a.invoiceNumber) // Latest first
}

// Get invoice by number
export function getInvoiceByNumber(invoiceNumber: number): InvoiceRecord | null {
  const db = readDatabase()
  return db.invoices.find((inv) => inv.invoiceNumber === invoiceNumber) || null
}

// Update invoice
export function updateInvoice(invoiceNumber: number, updates: Partial<InvoiceRecord>): InvoiceRecord | null {
  const db = readDatabase()
  const index = db.invoices.findIndex((inv) => inv.invoiceNumber === invoiceNumber)

  if (index === -1) return null

  db.invoices[index] = { ...db.invoices[index], ...updates }
  writeDatabase(db)
  return db.invoices[index]
}

// Delete invoice
export function deleteInvoice(invoiceNumber: number): boolean {
  const db = readDatabase()
  const initialLength = db.invoices.length
  db.invoices = db.invoices.filter((inv) => inv.invoiceNumber !== invoiceNumber)

  if (db.invoices.length < initialLength) {
    writeDatabase(db)
    return true
  }
  return false
}

// Get database stats
export function getDatabaseStats() {
  const db = readDatabase()
  const totalInvoices = db.invoices.length
  const paidInvoices = db.invoices.filter((inv) => inv.isPaid).length
  const unpaidInvoices = totalInvoices - paidInvoices
  const totalAmount = db.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidAmount = db.invoices.filter((inv) => inv.isPaid).reduce((sum, inv) => sum + inv.totalAmount, 0)

  return {
    totalInvoices,
    paidInvoices,
    unpaidInvoices,
    totalAmount,
    paidAmount,
    unpaidAmount: totalAmount - paidAmount,
    lastInvoiceNumber: db.lastInvoiceNumber,
  }
}
