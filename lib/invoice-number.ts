// Browser-compatible invoice number management using localStorage
export async function getNextInvoiceNumber(): Promise<number> {
  try {
    // Check if we're in browser environment
    if (typeof window === "undefined") {
      // Server-side: return a random number for now
      return Math.floor(Math.random() * 1000) + 1
    }

    // Use localStorage for browser environment
    const stored = localStorage.getItem("invoice_number")
    if (stored) {
      const { invoice_number } = JSON.parse(stored)
      return invoice_number + 1
    }
    return 1
  } catch (error) {
    // If localStorage fails, start with 1
    return 1
  }
}

export async function saveInvoiceNumber(invoiceNumber: number): Promise<void> {
  try {
    // Check if we're in browser environment
    if (typeof window === "undefined") {
      // Server-side: do nothing for now
      return
    }

    // Save to localStorage
    localStorage.setItem("invoice_number", JSON.stringify({ invoice_number: invoiceNumber }))
  } catch (error) {
    // If localStorage fails, just continue (invoice will still be generated)
    console.warn("Failed to save invoice number:", error)
  }
}
