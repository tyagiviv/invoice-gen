const nodemailer = require("nodemailer")
const fs = require("fs")
const path = require("path")

async function testGmailConnection() {
  console.log("📧 Testing Gmail Connection...")

  // Read config.ini
  const configPath = path.join(process.cwd(), "config.ini")
  if (!fs.existsSync(configPath)) {
    console.log("❌ config.ini not found!")
    return
  }

  const configContent = fs.readFileSync(configPath, "utf-8")
  const config = {}
  let currentSection = ""

  // Parse config.ini
  for (const line of configContent.split("\n")) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) continue

    const sectionMatch = trimmedLine.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      config[currentSection] = {}
      continue
    }

    const keyValueMatch = trimmedLine.match(/^(.+?)\s*=\s*(.+)$/)
    if (keyValueMatch && currentSection) {
      const key = keyValueMatch[1].trim().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      config[currentSection][key] = keyValueMatch[2].trim()
    }
  }

  if (!config.email || !config.email.user || !config.email.password) {
    console.log("❌ Email configuration missing in config.ini")
    return
  }

  console.log("📧 Email user:", config.email.user)
  console.log("🔑 Password length:", config.email.password.length, "characters")

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    })

    console.log("🔧 Testing connection...")
    await transporter.verify()
    console.log("✅ Gmail connection successful!")

    // Send test email
    console.log("📤 Sending test email...")
    const result = await transporter.sendMail({
      from: `"${config.email.fromName || "Test"}" <${config.email.user}>`,
      to: config.email.user, // Send to yourself
      subject: "Test Email from Invoice Generator",
      text: "This is a test email to verify your Gmail configuration is working!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Gmail Configuration Test</h2>
          <p>This is a test email to verify your Gmail configuration is working!</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    })

    console.log("✅ Test email sent successfully!")
    console.log("📧 Message ID:", result.messageId)
    console.log("📬 Check your inbox for the test email")
  } catch (error) {
    console.error("❌ Gmail connection failed:", error.message)

    if (error.code === "EAUTH") {
      console.log("\n🔐 Authentication Error - Possible Solutions:")
      console.log("1. Make sure you're using a Gmail App Password, not your regular password")
      console.log("2. Enable 2-Factor Authentication on your Gmail account")
      console.log("3. Generate a new App Password: https://myaccount.google.com/apppasswords")
      console.log("4. Use the 16-character app password in config.ini")
    } else if (error.code === "ECONNECTION") {
      console.log("\n🌐 Connection Error - Check your internet connection")
    }
  }
}

testGmailConnection().catch(console.error)
