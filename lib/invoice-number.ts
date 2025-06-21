// This file should only run on the server side
const invoiceCounter = 1
let isInitialized = false

// Simple in-memory storage that persists during server runtime
// In production, you'd want to use a database
const invoiceStorage = {
  current: 1,
}

export async function getNextInvoiceNumber(): Promise<number> {
  // Initialize counter if not done yet
  if (!isInitialized) {
    // In a real app, you'd load this from a database
    // For now, we'll use a simple counter that starts from 1
    isInitialized = true
  }

  const nextNumber = invoiceStorage.current
  return nextNumber
}

export async function saveInvoiceNumber(invoiceNumber: number): Promise<void> {
  // Save the invoice number to our storage
  invoiceStorage.current = invoiceNumber + 1
}

// Get current invoice number without incrementing
export async function getCurrentInvoiceNumber(): Promise<number> {
  return invoiceStorage.current - 1
}
