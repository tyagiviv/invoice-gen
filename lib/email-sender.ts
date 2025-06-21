// Email functionality temporarily disabled due to serverless environment limitations
// You can integrate with SendGrid, Resend, or similar service for production use

export async function sendInvoiceEmail(recipientEmail: string, pdfBuffer: Buffer, invoiceNumber: number) {
  // Placeholder function - integrate with proper email service
  console.log(`Email would be sent to: ${recipientEmail} for invoice ${invoiceNumber}`)

  return {
    success: true,
    message: "Email functionality not implemented yet",
  }
}
