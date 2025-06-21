// Enhanced invoice database with WooCommerce integration
import { saveInvoice } from "./invoice-database"

interface WooCommerceWebhookData {
  id: number
  status: string
  billing: {
    first_name: string
    last_name: string
    email: string
    address_1: string
    city: string
    postcode: string
    country: string
  }
  line_items: Array<{
    name: string
    quantity: number
    total: string
    meta_data?: Array<{
      key: string
      value: string
    }>
  }>
  shipping_total: string
  total: string
  date_created: string
  payment_method: string
}

export async function handleWooCommerceWebhook(webhookData: WooCommerceWebhookData) {
  try {
    console.log(`Processing WooCommerce webhook for order #${webhookData.id}`)

    // Only process completed/processing orders
    if (!["completed", "processing"].includes(webhookData.status)) {
      console.log(`Skipping order #${webhookData.id} - status: ${webhookData.status}`)
      return { success: false, reason: "Order not completed" }
    }

    // Convert WooCommerce data to invoice format
    const items = webhookData.line_items.map((item) => {
      // Extract variation info from meta_data
      let variationText = ""
      if (item.meta_data) {
        const variations = item.meta_data
          .filter((meta) => !meta.key.startsWith("_"))
          .map((meta) => `${meta.key}: ${meta.value}`)
        if (variations.length > 0) {
          variationText = ` (${variations.join(", ")})`
        }
      }

      return {
        description: item.name + variationText,
        unitPrice: (Number.parseFloat(item.total) / item.quantity).toFixed(2),
        quantity: item.quantity.toString(),
        discount: "0",
        total: Number.parseFloat(item.total).toFixed(2),
      }
    })

    // Add shipping if exists
    if (Number.parseFloat(webhookData.shipping_total) > 0) {
      items.push({
        description: "Kohaletoimetamine",
        unitPrice: webhookData.shipping_total,
        quantity: "1",
        discount: "0",
        total: webhookData.shipping_total,
      })
    }

    // Create invoice
    const invoiceData = {
      invoiceNumber: 0, // Will be set by saveInvoice
      clientEmail: webhookData.billing.email,
      buyerName: `${webhookData.billing.first_name} ${webhookData.billing.last_name}`,
      clientAddress: `${webhookData.billing.address_1}\n${webhookData.billing.city}, ${webhookData.billing.postcode}\n${webhookData.billing.country}`,
      regCode: "",
      invoiceDate: webhookData.date_created.split("T")[0],
      dueDate: webhookData.date_created.split("T")[0],
      isPaid: webhookData.status === "completed",
      items,
      totalAmount: Number.parseFloat(webhookData.total),
      source: "website",
      woocommerce_order_id: webhookData.id,
      payment_method: webhookData.payment_method,
    }

    // Save to database (this will assign invoice number)
    const savedInvoice = saveInvoice(invoiceData)

    console.log(`✅ Invoice #${savedInvoice.invoiceNumber} created for WooCommerce order #${webhookData.id}`)

    return {
      success: true,
      invoiceNumber: savedInvoice.invoiceNumber,
      woocommerceOrderId: webhookData.id,
    }
  } catch (error) {
    console.error("Error processing WooCommerce webhook:", error)
    return { success: false, error: error.message }
  }
}
