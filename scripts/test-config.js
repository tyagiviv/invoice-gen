// Test script to verify config.ini is working
import { getConfig, getEmailConfig, getInvoiceConfig } from "../lib/config-reader.js"

console.log("🧪 Testing config.ini...")

try {
  const config = getConfig()
  console.log("✅ Configuration loaded successfully!")

  const emailConfig = getEmailConfig()
  console.log("📧 Email config:")
  console.log(`   User: ${emailConfig.user}`)
  console.log(`   From: ${emailConfig.fromName}`)
  console.log(`   Password: ${"*".repeat(emailConfig.password.length)}`)

  const invoiceConfig = getInvoiceConfig()
  console.log("📄 Invoice config:")
  console.log(`   Company: ${invoiceConfig.companyName}`)
  console.log(`   Starting #: ${invoiceConfig.startingNumber}`)
  console.log(`   Email: ${invoiceConfig.companyEmail}`)

  console.log("🎉 All configuration tests passed!")
} catch (error) {
  console.error("❌ Configuration test failed:", error.message)
  console.log("📝 Please check your config.ini file")
}
