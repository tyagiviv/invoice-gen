// Integration script for LapaDuu.ee cart system
// Add this to your existing website

interface LapaDuuCartItem {
  productName: string
  price: number
  quantity: number
  productId?: string
  variant?: string // e.g., "Small", "Medium", "Large" for wraps
}

interface LapaDuuOrder {
  customerEmail: string
  customerName: string
  customerPhone?: string
  shippingAddress: string
  cartItems: LapaDuuCartItem[]
  totalAmount: number
  orderDate: string
  paymentMethod: string
}

// Function to create invoice after successful order
export async function createInvoiceForLapaDuuOrder(orderData: LapaDuuOrder) {
  try {
    console.log("Creating invoice for LapaDuu order...")

    // Map cart items to invoice format
    const invoiceItems = orderData.cartItems.map((item) => ({
      description: `${item.productName}${item.variant ? ` (${item.variant})` : ""}`,
      unitPrice: item.price.toFixed(2),
      quantity: item.quantity.toString(),
      discount: "0", // No discounts for website orders
      total: (item.price * item.quantity).toFixed(2),
    }))

    // Create invoice via API
    const response = await fetch("/api/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientEmail: orderData.customerEmail,
        buyerName: orderData.customerName,
        clientAddress: orderData.shippingAddress,
        regCode: "", // Most customers won't have business reg code
        invoiceDate: orderData.orderDate,
        dueDate: orderData.orderDate, // Same day since it's pre-paid
        isPaid: true, // Website orders are pre-paid
        source: "website", // Track that this came from website
        items: invoiceItems,
      }),
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Invoice #${result.invoiceNumber} created for order`)

      // Optional: Email PDF to customer
      if (result.downloadUrl) {
        await emailInvoiceToCustomer(orderData.customerEmail, result.downloadUrl, result.invoiceNumber)
      }

      return {
        success: true,
        invoiceNumber: result.invoiceNumber,
        downloadUrl: result.downloadUrl,
      }
    } else {
      console.error("Invoice creation failed:", result.message)
      return { success: false, error: result.message }
    }
  } catch (error) {
    console.error("Error creating invoice:", error)
    // Don't break the order process if invoice fails
    return { success: false, error: "Invoice creation failed" }
  }
}

// Optional: Email invoice to customer
async function emailInvoiceToCustomer(email: string, pdfUrl: string, invoiceNumber: number) {
  try {
    // You can integrate with your existing email system
    // or use the invoice generator's email functionality
    console.log(`Would email invoice #${invoiceNumber} to ${email}`)

    // Example integration with your email service:
    /*
    await sendEmail({
      to: email,
      subject: `LapaDuu OÜ Arve #${invoiceNumber}`,
      body: `Tere! Siin on teie arve LapaDuu tellimuse eest.`,
      attachments: [{ 
        filename: `LapaDuu_Arve_${invoiceNumber}.pdf`,
        content: pdfUrl 
      }]
    })
    */
  } catch (error) {
    console.error("Failed to email invoice:", error)
  }
}

// Example usage in your checkout process
export function integrateWithCheckout() {
  // Add this to your existing checkout success handler

  // Example: After payment is confirmed
  const handleOrderSuccess = async (orderData: LapaDuuOrder) => {
    try {
      // Your existing order processing...
      console.log("Order completed successfully")

      // NEW: Create invoice for the order
      const invoiceResult = await createInvoiceForLapaDuuOrder(orderData)

      if (invoiceResult.success) {
        console.log(`Invoice created: #${invoiceResult.invoiceNumber}`)
        // You could show this to the customer or store it in your order system
      }

      // Continue with your existing success flow...
    } catch (error) {
      console.error("Order processing error:", error)
    }
  }

  return handleOrderSuccess
}
