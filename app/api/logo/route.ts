import { NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    // Try to read the logo file from the public directory
    const logoPath = join(process.cwd(), "public", "logo.png")
    console.log("Attempting to read logo from:", logoPath)

    if (existsSync(logoPath)) {
      const logoBuffer = readFileSync(logoPath)
      console.log("Logo file read successfully, size:", logoBuffer.length, "bytes")

      // Return the logo as base64
      const base64 = logoBuffer.toString("base64")
      return NextResponse.json({
        success: true,
        logo: `data:image/png;base64,${base64}`,
        size: logoBuffer.length,
      })
    } else {
      console.log("Logo file not found at:", logoPath)

      // Try alternative paths
      const alternativePaths = [join(process.cwd(), "logo.png"), join(process.cwd(), "public", "placeholder-logo.png")]

      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          const logoBuffer = readFileSync(altPath)
          const base64 = logoBuffer.toString("base64")
          console.log("Logo found at alternative path:", altPath)
          return NextResponse.json({
            success: true,
            logo: `data:image/png;base64,${base64}`,
            size: logoBuffer.length,
          })
        }
      }

      // Return placeholder if no logo found
      return NextResponse.json({
        success: false,
        message: "Logo file not found",
        placeholder: createPlaceholderLogo(),
      })
    }
  } catch (error) {
    console.error("Error reading logo:", error)
    return NextResponse.json({
      success: false,
      message: "Error reading logo file",
      placeholder: createPlaceholderLogo(),
    })
  }
}

function createPlaceholderLogo(): string {
  const svgLogo = `
    <svg width="180" height="152" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="152" fill="#e6f3ff" stroke="#0066cc" stroke-width="2" rx="8"/>
      <text x="90" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0066cc">
        LapaDuu
      </text>
      <text x="90" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#0066cc">
        OÜ
      </text>
      <circle cx="90" cy="120" r="15" fill="none" stroke="#0066cc" stroke-width="2"/>
      <text x="90" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#0066cc">
        EST
      </text>
    </svg>
  `

  const base64Svg = Buffer.from(svgLogo).toString("base64")
  return `data:image/svg+xml;base64,${base64Svg}`
}
