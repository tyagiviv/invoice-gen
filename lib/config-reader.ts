import { readFileSync, existsSync } from "fs"
import { join } from "path"

interface EmailConfig {
  user: string
  password: string
  fromName: string
}

interface InvoiceConfig {
  startingNumber: number
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyBank: string
}

interface ApiConfig {
  baseUrl: string
  webhookSecret: string
}

interface DevelopmentConfig {
  debugMode: boolean
  testEmail: string
}

interface AppConfig {
  email: EmailConfig
  invoice: InvoiceConfig
  api: ApiConfig
  development: DevelopmentConfig
}

let cachedConfig: AppConfig | null = null

export function getConfig(): AppConfig {
  if (cachedConfig) {
    console.log("📋 Using cached configuration")
    return cachedConfig
  }

  const configPath = join(process.cwd(), "config.ini")

  if (!existsSync(configPath)) {
    console.error("❌ config.ini file not found at:", configPath)
    console.log("📝 Please create config.ini file in the project root")
    throw new Error("Configuration file missing")
  }

  try {
    console.log("📖 Reading config.ini from:", configPath)
    const configContent = readFileSync(configPath, "utf-8")
    console.log("📄 Config file size:", configContent.length, "characters")

    const config = parseIniFile(configContent)
    console.log("🔧 Parsed config sections:", Object.keys(config))

    // Validate required fields
    validateConfig(config)

    cachedConfig = config
    console.log("✅ Configuration loaded and cached successfully")
    console.log("📧 Email user:", config.email?.user || "NOT SET")
    console.log("🏢 Company name:", config.invoice?.companyName || "NOT SET")

    return config
  } catch (error) {
    console.error("❌ Error reading config.ini:", error.message)
    throw error
  }
}

function parseIniFile(content: string): AppConfig {
  const lines = content.split("\n")
  const config: any = {}
  let currentSection = ""

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith(";")) {
      continue
    }

    // Check for section headers [section]
    const sectionMatch = trimmedLine.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      config[currentSection] = {}
      continue
    }

    // Parse key-value pairs
    const keyValueMatch = trimmedLine.match(/^(.+?)\s*=\s*(.+)$/)
    if (keyValueMatch && currentSection) {
      const key = keyValueMatch[1].trim()
      let value: any = keyValueMatch[2].trim()

      // Convert specific values to appropriate types
      if (value === "true") value = true
      else if (value === "false") value = false
      else if (/^\d+$/.test(value)) value = Number.parseInt(value, 10)

      // Convert snake_case to camelCase for JavaScript
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      config[currentSection][camelKey] = value
    }
  }

  return config as AppConfig
}

function validateConfig(config: AppConfig): void {
  const requiredFields = [
    ["email", "user"],
    ["email", "password"],
    ["invoice", "companyName"],
    ["invoice", "companyEmail"],
  ]

  for (const [section, field] of requiredFields) {
    if (!config[section] || !config[section][field]) {
      throw new Error(`Missing required configuration: [${section}] ${field}`)
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(config.email.user)) {
    throw new Error("Invalid email format in configuration")
  }

  console.log("✅ Configuration validation passed")
}

// Helper functions to get specific config sections
export function getEmailConfig(): EmailConfig {
  return getConfig().email
}

export function getInvoiceConfig(): InvoiceConfig {
  return getConfig().invoice
}

export function getApiConfig(): ApiConfig {
  return getConfig().api
}

export function getDevelopmentConfig(): DevelopmentConfig {
  return getConfig().development
}

// Check if running in development mode
export function isDevelopmentMode(): boolean {
  try {
    return getDevelopmentConfig().debugMode
  } catch {
    return process.env.NODE_ENV === "development"
  }
}
