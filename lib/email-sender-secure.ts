import nodemailer from "nodemailer"
import { getEmailConfig, getInvoiceConfig, isDevelopmentMode } from "./config-reader"

// Enhanced email sender using config.ini
export async function sendInvoiceEmailSecure(
  recipientEmail: string,
  pdfBuffer: Buffer,
  invoiceNumber: number,
  customerName?: string,
  source: "manual" | "website" = "manual",
) {
  console.log(`📧 Preparing to send invoice #${invoiceNumber} to ${recipientEmail}`)

  try {
    // Load configuration from config.ini
    const emailConfig = getEmailConfig()
    const invoiceConfig = getInvoiceConfig()

    console.log(`📧 Using email: ${emailConfig.user}`)
    console.log(`🏢 From: ${emailConfig.fromName}`)

    // Create transporter using config.ini settings
    const transporter = nodemailer.createTransporter({
      service: "gmail", // or your preferred service
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    })

    // Use development test email if in debug mode
    const finalRecipientEmail = isDevelopmentMode()
      ? getDevelopmentConfig().testEmail || recipientEmail
      : recipientEmail

    if (isDevelopmentMode() && finalRecipientEmail !== recipientEmail) {
      console.log(`🧪 Development mode: Redirecting email from ${recipientEmail} to ${finalRecipientEmail}`)
    }

    // Customize email content based on source
    const emailContent = getEmailContent(invoiceNumber, customerName, source, invoiceConfig)

    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.user}>`,
      to: finalRecipientEmail,
      subject: `${invoiceConfig.companyName} Arve #${invoiceNumber}`,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [
        {
          filename: `${invoiceConfig.companyName.replace(/\s+/g, "-")}-Arve-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    }

    const result = await transporter.sendMail(mailOptions)

    console.log(`✅ Email sent successfully to ${finalRecipientEmail}`)
    console.log(`📧 Message ID: ${result.messageId}`)

    return {
      success: true,
      messageId: result.messageId,
      message: `Email sent successfully to ${finalRecipientEmail}`,
      sentTo: finalRecipientEmail,
      originalRecipient: recipientEmail,
    }
  } catch (error) {
    console.error(`❌ Email sending failed:`, error)
    return {
      success: false,
      error: error.message,
      message: `Failed to send email to ${recipientEmail}`,
    }
  }
}

function getEmailContent(
  invoiceNumber: number,
  customerName: string | undefined,
  source: "manual" | "website",
  invoiceConfig: any,
) {
  const greeting = customerName ? `Tere ${customerName}!` : "Tere!"

  if (source === "website") {
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="color: #2c5530;">${invoiceConfig.companyName}</h2>
          </div>
          
          <div style="padding: 30px 20px;">
            <p>${greeting}</p>
            
            <p><strong>Täname teid tellimuse eest!</strong></p>
            
            <p>Teie tellimus on edukalt töödeldud ja manuses leiate arve PDF-failina.</p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Arve number:</strong> #${invoiceNumber}</p>
            </div>
            
            <p>Kui teil on küsimusi tellimuse kohta, võtke meiega julgelt ühendust.</p>
            
            <p>Parimate soovidega,<br>
            <strong>${invoiceConfig.companyName} meeskond</strong></p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>${invoiceConfig.companyName} | ${invoiceConfig.companyAddress}</p>
            <p>Tel: ${invoiceConfig.companyPhone} | Email: ${invoiceConfig.companyEmail}</p>
          </div>
        </div>
      `,
      text: `
${greeting}

Täname teid tellimuse eest!

Teie tellimus on edukalt töödeldud ja manuses leiate arve PDF-failina.

Arve number: #${invoiceNumber}

Kui teil on küsimusi tellimuse kohta, võtke meiega julgelt ühendust.

Parimate soovidega,
${invoiceConfig.companyName} meeskond

${invoiceConfig.companyName} | ${invoiceConfig.companyAddress}
Tel: ${invoiceConfig.companyPhone} | Email: ${invoiceConfig.companyEmail}
      `,
    }
  } else {
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="color: #2c5530;">${invoiceConfig.companyName}</h2>
          </div>
          
          <div style="padding: 30px 20px;">
            <p>${greeting}</p>
            
            <p>Manuses leiate arve meie osutatud teenuste/toodete eest.</p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Arve number:</strong> #${invoiceNumber}</p>
            </div>
            
            <p>Palume arve tasumisel märkida selgitusse arve number.</p>
            
            <p>Kui teil on küsimusi arve kohta, võtke meiega julgelt ühendust.</p>
            
            <p>Parimate soovidega,<br>
            <strong>${invoiceConfig.companyName} meeskond</strong></p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>${invoiceConfig.companyName} | ${invoiceConfig.companyAddress}</p>
            <p>Tel: ${invoiceConfig.companyPhone} | Email: ${invoiceConfig.companyEmail}</p>
            <p>${invoiceConfig.companyBank}</p>
          </div>
        </div>
      `,
      text: `
${greeting}

Manuses leiate arve meie osutatud teenuste/toodete eest.

Arve number: #${invoiceNumber}

Palume arve tasumisel märkida selgitusse arve number.

Kui teil on küsimusi arve kohta, võtke meiega julgelt ühendust.

Parimate soovidega,
${invoiceConfig.companyName} meeskond

${invoiceConfig.companyName} | ${invoiceConfig.companyAddress}
Tel: ${invoiceConfig.companyPhone} | Email: ${invoiceConfig.companyEmail}
${invoiceConfig.companyBank}
      `,
    }
  }
}

// Import development config helper
function getDevelopmentConfig() {
  return getConfig().development
}

// Re-export for compatibility
import { getConfig } from "./config-reader"
