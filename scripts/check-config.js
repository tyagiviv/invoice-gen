const fs = require("fs")
const path = require("path")

function checkConfig() {
  console.log("🔍 Checking config.ini file...")

  const configPath = path.join(process.cwd(), "config.ini")

  if (!fs.existsSync(configPath)) {
    console.log("❌ config.ini file not found!")
    console.log("📝 Please create config.ini in your project root")
    console.log("💡 You can copy from config.example.ini")
    return false
  }

  console.log("✅ config.ini file found")

  try {
    const configContent = fs.readFileSync(configPath, "utf-8")
    console.log("📄 File size:", configContent.length, "characters")

    // Parse the config
    const config = {}
    let currentSection = ""
    const lines = configContent.split("\n")

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith(";")) {
        continue
      }

      // Section headers
      const sectionMatch = trimmedLine.match(/^\[(.+)\]$/)
      if (sectionMatch) {
        currentSection = sectionMatch[1]
        config[currentSection] = {}
        console.log("📂 Found section:", currentSection)
        continue
      }

      // Key-value pairs
      const keyValueMatch = trimmedLine.match(/^(.+?)\s*=\s*(.+)$/)
      if (keyValueMatch && currentSection) {
        const key = keyValueMatch[1].trim()
        const value = keyValueMatch[2].trim()
        config[currentSection][key] = value

        // Show key without revealing sensitive values
        if (key.toLowerCase().includes("password")) {
          console.log(`  ✅ ${key} = [HIDDEN - ${value.length} characters]`)
        } else {
          console.log(`  ✅ ${key} = ${value}`)
        }
      }
    }

    // Check required fields
    console.log("\n🔍 Checking required fields...")

    const requiredFields = [
      ["email", "user", "Email address"],
      ["email", "password", "Email password"],
      ["invoice", "company_name", "Company name"],
      ["invoice", "company_email", "Company email"],
    ]

    let allGood = true

    for (const [section, field, description] of requiredFields) {
      if (config[section] && config[section][field]) {
        console.log(`✅ ${description}: Found`)
      } else {
        console.log(`❌ ${description}: Missing [${section}] ${field}`)
        allGood = false
      }
    }

    if (allGood) {
      console.log("\n🎉 Configuration looks good!")
      console.log("📧 Email user:", config.email?.user || "NOT SET")

      // Validate email format
      if (config.email?.user) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(config.email.user)) {
          console.log("✅ Email format is valid")
        } else {
          console.log("❌ Email format is invalid")
          allGood = false
        }
      }
    } else {
      console.log("\n❌ Configuration has missing fields")
    }

    return allGood
  } catch (error) {
    console.error("❌ Error reading config:", error.message)
    return false
  }
}

// Run the check
const isValid = checkConfig()

if (isValid) {
  console.log("\n🚀 Next steps:")
  console.log("1. Start your development server: npm run dev")
  console.log("2. Create an invoice with an email address")
  console.log("3. Check the server console for email sending logs")
} else {
  console.log("\n🔧 Fix the configuration issues above and try again")
}
