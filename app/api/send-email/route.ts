import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Force this API route to use Node.js runtime instead of Edge runtime
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { from, to, subject, text, attachments } = await request.json()

    // Use Gmail's SMTP with basic authentication
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    const mailOptions = {
      from,
      to,
      subject,
      text,
      attachments: attachments.map((att: any) => ({
        filename: att.filename,
        content: Buffer.from(att.content, "base64"),
        contentType: att.contentType,
      })),
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
