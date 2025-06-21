// Alternative: JavaScript webhook approach
// Add this to your WooCommerce checkout success page

document.addEventListener("DOMContentLoaded", () => {
  // Check if this is a successful checkout
  if (window.location.href.includes("order-received")) {
    const urlParams = new URLSearchParams(window.location.search)
    const orderId = urlParams.get("order")
    const orderKey = urlParams.get("key")

    if (orderId && orderKey) {
      createInvoiceForWooOrder(orderId, orderKey)
    }
  }
})

async function createInvoiceForWooOrder(orderId, orderKey) {
  try {
    console.log(`Creating invoice for WooCommerce order #${orderId}`)

    // Get order data from WooCommerce REST API
    const orderData = await fetchWooCommerceOrder(orderId, orderKey)

    if (!orderData) {
      console.error("Could not fetch order data")
      return
    }

    // Convert WooCommerce order to invoice format
    const invoiceData = convertWooOrderToInvoice(orderData)

    // Create invoice
    const response = await fetch("/api/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Invoice #${result.invoiceNumber} created for WooCommerce order #${orderId}`)

      // Optional: Show success message to customer
      showInvoiceCreatedMessage(result.invoiceNumber)
    }
  } catch (error) {
    console.error("Error creating invoice for WooCommerce order:", error)
  }
}

function convertWooOrderToInvoice(orderData) {
  // Map WooCommerce order to invoice format
  const items = orderData.line_items.map((item) => ({
    description: `${item.name}${item.variation ? ` (${item.variation})` : ""}`,
    unitPrice: (Number.parseFloat(item.total) / item.quantity).toFixed(2),
    quantity: item.quantity.toString(),
    discount: "0",
    total: Number.parseFloat(item.total).toFixed(2),
  }))

  // Add shipping
  if (orderData.shipping_total > 0) {
    items.push({
      description: "Kohaletoimetamine",
      unitPrice: orderData.shipping_total,
      quantity: "1",
      discount: "0",
      total: orderData.shipping_total,
    })
  }

  return {
    clientEmail: orderData.billing.email,
    buyerName: `${orderData.billing.first_name} ${orderData.billing.last_name}`,
    clientAddress: `${orderData.billing.address_1}\n${orderData.billing.city}, ${orderData.billing.postcode}\n${orderData.billing.country}`,
    regCode: "",
    invoiceDate: orderData.date_created.split("T")[0],
    dueDate: orderData.date_created.split("T")[0],
    isPaid: orderData.status === "completed",
    source: "website",
    items: items,
  }
}

// Mock functions - replace with your actual implementations
async function fetchWooCommerceOrder(orderId, orderKey) {
  console.warn("fetchWooCommerceOrder is a mock function. Implement the actual WooCommerce API call.")
  return {
    billing: {
      first_name: "John",
      last_name: "Doe",
      address_1: "123 Main St",
      city: "Anytown",
      postcode: "12345",
      country: "US",
      email: "john.doe@example.com",
    },
    date_created: new Date().toISOString(),
    status: "completed",
    line_items: [
      {
        name: "Product 1",
        quantity: 2,
        total: "20.00",
        variation: null,
      },
    ],
    shipping_total: "5.00",
  }
}

function showInvoiceCreatedMessage(invoiceNumber) {
  console.warn("showInvoiceCreatedMessage is a mock function. Implement the actual UI message.")
  alert(`Invoice #${invoiceNumber} created!`)
}
