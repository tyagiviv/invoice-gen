import nodemailer from "nodemailer"

// Enhanced email sender with PDF attachment support
export async function sendInvoiceEmailSimple(
  recipientEmail: string,
  pdfBuffer: Buffer,
  invoiceNumber: number,
  customerName?: string,
  source: "manual" | "website" = "manual",
) {
  console.log(`📧 Preparing to send invoice #${invoiceNumber} to ${recipientEmail}`)

  try {
    // Create transporter using environment variables
    const transporter = nodemailer.createTransporter({
      service: "gmail", // or your preferred service
      auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_PASSWORD, // app-specific password
      },
    })

    // Customize email content based on source
    const emailContent =
      source === "website"
        ? getWebsiteOrderEmailContent(invoiceNumber, customerName)
        : getManualInvoiceEmailContent(invoiceNumber, customerName)

    const mailOptions = {
      from: `"LapaDuu OÜ" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `LapaDuu OÜ Arve #${invoiceNumber}`,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [
        {
          filename: `LapaDuu-Arve-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    }

    const result = await transporter.sendMail(mailOptions)

    console.log(`✅ Email sent successfully to ${recipientEmail}`)
    console.log(`📧 Message ID: ${result.messageId}`)

    return {
      success: true,
      messageId: result.messageId,
      message: `Email sent successfully to ${recipientEmail}`,
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

function getWebsiteOrderEmailContent(invoiceNumber: number, customerName?: string) {
  const greeting = customerName ? `Tere ${customerName}!` : "Tere!"

  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #2c5530;">LapaDuu OÜ</h2>
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
          <strong>LapaDuu meeskond</strong></p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>LapaDuu OÜ | Pärnu mnt 129b-14, Tallinn 11314</p>
          <p>Tel: +372 53702287 | Email: lapaduu@lapaduu.ee</p>
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
LapaDuu meeskond

LapaDuu OÜ | Pärnu mnt 129b-14, Tallinn 11314
Tel: +372 53702287 | Email: lapaduu@lapaduu.ee
    `,
  }
}

function getManualInvoiceEmailContent(invoiceNumber: number, customerName?: string) {
  const greeting = customerName ? `Tere ${customerName}!` : "Tere!"

  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #2c5530;">LapaDuu OÜ</h2>
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
          <strong>LapaDuu meeskond</strong></p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>LapaDuu OÜ | Pärnu mnt 129b-14, Tallinn 11314</p>
          <p>Tel: +372 53702287 | Email: lapaduu@lapaduu.ee</p>
          <p>Swedbank: EE122200221072678443</p>
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
LapaDuu meeskond

LapaDuu OÜ | Pärnu mnt 129b-14, Tallinn 11314
Tel: +372 53702287 | Email: lapaduu@lapaduu.ee
Swedbank: EE122200221072678443
    `,
  }
}
