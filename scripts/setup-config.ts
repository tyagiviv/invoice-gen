// Setup script to help create config.ini
import { writeFileSync, existsSync } from "fs"
import { join } from "path"

const configTemplate = `# LapaDuu Invoice Generator Configuration
# Generated on ${new Date().toISOString()}

[email]
user = lapaduu@lapaduu.ee
password = YOUR_APP_SPECIFIC_PASSWORD_HERE
from_name = LapaDuu OÜ

[invoice]
starting_number = 500
company_name = LapaDuu OÜ
company_address = Pärnu mnt 129b-14, Tallinn 11314
company_phone = +372 53702287
company_email = lapaduu@lapaduu.ee
company_bank = Swedbank: EE122200221072678443

[api]
base_url = https://your-invoice-generator.vercel.app
webhook_secret = ${generateRandomSecret()}

[development]
debug_mode = true
test_email = test@lapaduu.ee
`

function generateRandomSecret(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function setupConfig() {
  const configPath = join(process.cwd(), "config.ini")

  if (existsSync(configPath)) {
    console.log("⚠️  config.ini already exists!")
    console.log("📝 Please edit it manually or delete it first")
    return
  }

  try {
    writeFileSync(configPath, configTemplate)
    console.log("✅ config.ini created successfully!")
    console.log("📝 Please edit config.ini and add your actual email password")
    console.log("🔒 Remember: config.ini is in .gitignore and won't be committed")
  } catch (error) {
    console.error("❌ Error creating config.ini:", error)
  }
}

// Run the setup
setupConfig()
