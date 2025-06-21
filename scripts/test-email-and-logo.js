const fs = require("fs")
const path = require("path")

async function testEmailAndLogo() {
  console.log("🧪 Testing Email and Logo Configuration...")

  // Test 1: Check if config.ini exists
  const configPath = path.join(process.cwd(), "config.ini")
  if (fs.existsSync(configPath)) {
    console.log("✅ config.ini found")

    // Read and parse basic config
    const configContent = fs.readFileSync(configPath, "utf-8")
    const hasEmailSection = configContent.includes("[email]")
    const hasEmailUser = configContent.includes("user =")
    const hasEmailPassword = configContent.includes("password =")

    console.log("📧 Email config check:")
    console.log("  - [email] section:", hasEmailSection ? "✅" : "❌")
    console.log("  - user setting:", hasEmailUser ? "✅" : "❌")
    console.log("  - password setting:", hasEmailPassword ? "✅" : "❌")
  } else {
    console.log("❌ config.ini not found!")
    return
  }

  // Test 2: Check logo file
  const logoPath = path.join(process.cwd(), "public", "logo.png")
  if (fs.existsSync(logoPath)) {
    const logoStats = fs.statSync(logoPath)
    console.log("🖼️ Logo file check:")
    console.log("  - File exists: ✅")
    console.log("  - File size:", logoStats.size, "bytes")

    // Check if it's a valid PNG
    const logoBuffer = fs.readFileSync(logoPath)
    const pngHeader = logoBuffer.slice(0, 8)
    const expectedPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    if (pngHeader.equals(expectedPngHeader)) {
      console.log("  - Valid PNG: ✅")
    } else {
      console.log("  - Valid PNG: ❌")
      console.log("  - File header:", pngHeader.toString("hex"))
    }
  } else {
    console.log("🖼️ Logo file: ❌ not found at", logoPath)
  }

  // Test 3: Test logo API if server is running
  try {
    console.log("\n🌐 Testing logo API...")
    const response = await fetch("http://localhost:3000/api/logo")

    if (response.ok) {
      const data = await response.json()
      console.log("📡 Logo API response:")
      console.log("  - Success:", data.success ? "✅" : "❌")
      console.log("  - Has logo:", data.logo ? "✅" : "❌")
      console.log("  - Logo size:", data.size || "N/A")

      if (data.logo) {
        console.log("  - Logo preview:", data.logo.substring(0, 50) + "...")
      }
    } else {
      console.log("❌ Logo API failed:", response.status)
    }
  } catch (apiError) {
    console.log("⚠️ Logo API test skipped (server not running)")
  }

  console.log("\n🎯 Next steps:")
  console.log("1. Make sure your config.ini has correct email credentials")
  console.log("2. Verify your logo.png file is valid")
  console.log("3. Test creating an invoice with email")
  console.log("4. Check the console logs for detailed debugging")
}

testEmailAndLogo().catch(console.error)
