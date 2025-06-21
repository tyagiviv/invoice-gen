const fs = require("fs")
const path = require("path")

async function testConfigEmail() {
  console.log("🧪 Testing Email Configuration...")

  // Test 1: Check if config.ini exists and has email settings
  const configPath = path.join(process.cwd(), "config.ini")

  if (!fs.existsSync(configPath)) {
    console.log("❌ config.ini not found!")
    return
  }

  console.log("✅ config.ini found")

  // Read and parse config
  const configContent = fs.readFileSync(configPath, "utf-8")
  console.log("\n📄 Config file content preview:")

  // Show config structure without revealing passwords
  const lines = configContent.split("\n")
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.includes("password")) {
      console.log("  password = [HIDDEN]")
    } else if (trimmedLine) {
      console.log("  " + trimmedLine)
    }
  }

  // Test 2: Try to load config using our config reader
  try {
    console.log("\n🔧 Testing config reader...")

    // We can't directly import TypeScript in Node.js, so let's test the API
    const testResponse = await fetch("http://localhost:3000/api/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientEmail: "test@example.com",
        buyerName: "Test Customer",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        items: [
          {
            description: "Test Item",
            unitPrice: "10.00",
            quantity: "1",
            discount: "0",
            total: "10.00",
          },
        ],
      }),
    })

    if (testResponse.ok) {
      const result = await testResponse.json()
      console.log("✅ API test successful")
      console.log("📧 Email sending:", result.message.includes("emailed") ? "✅ SUCCESS" : "⚠️ NO EMAIL")
      console.log("📄 Invoice number:", result.invoiceNumber)
    } else {
      console.log("❌ API test failed:", testResponse.status)
      const errorText = await testResponse.text()
      console.log("Error:", errorText)
    }
  } catch (apiError) {
    console.log("⚠️ API test skipped (server not running or error):", apiError.message)
  }

  console.log("\n🎯 Troubleshooting tips:")
  console.log("1. Make sure your Gmail app password is correct")
  console.log("2. Check that Gmail 2FA is enabled and app password is generated")
  console.log("3. Verify email format in config.ini")
  console.log("4. Check server console logs for detailed error messages")
}

testConfigEmail().catch(console.error)
