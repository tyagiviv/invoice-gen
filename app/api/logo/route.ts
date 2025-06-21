import { NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    console.log("🔍 Logo API called")

    // Try to read the logo file from the public directory
    const logoPath = join(process.cwd(), "public", "logo.png")
    console.log("📁 Checking logo path:", logoPath)

    if (existsSync(logoPath)) {
      const logoBuffer = readFileSync(logoPath)
      console.log("✅ Logo file read successfully")
      console.log("📏 File size:", logoBuffer.length, "bytes")

      // Validate PNG header
      const pngHeader = logoBuffer.slice(0, 8)
      const expectedPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

      if (pngHeader.equals(expectedPngHeader)) {
        console.log("✅ Valid PNG file detected")
      } else {
        console.log("⚠️ File may not be a valid PNG")
        console.log("File header:", pngHeader.toString("hex"))
      }

      // Convert to base64
      const base64 = logoBuffer.toString("base64")
      const dataUri = `data:image/png;base64,${base64}`

      console.log("✅ Logo converted to base64")
      console.log("📏 Base64 length:", base64.length)
      console.log("📏 Data URI length:", dataUri.length)

      return NextResponse.json({
        success: true,
        logo: dataUri,
        size: logoBuffer.length,
        format: "PNG",
        base64Length: base64.length,
      })
    } else {
      console.log("❌ Logo file not found at:", logoPath)

      // Try alternative paths
      const alternativePaths = [
        join(process.cwd(), "logo.png"),
        join(process.cwd(), "public", "placeholder-logo.png"),
        join(process.cwd(), "public", "logo.jpg"),
        join(process.cwd(), "public", "logo.jpeg"),
      ]

      for (const altPath of alternativePaths) {
        console.log("🔍 Trying alternative path:", altPath)
        if (existsSync(altPath)) {
          const logoBuffer = readFileSync(altPath)
          const base64 = logoBuffer.toString("base64")

          // Determine format from file extension
          const ext = altPath.toLowerCase().split(".").pop()
          const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png"
          const dataUri = `data:${mimeType};base64,${base64}`

          console.log("✅ Logo found at alternative path:", altPath)
          return NextResponse.json({
            success: true,
            logo: dataUri,
            size: logoBuffer.length,
            format: ext?.toUpperCase(),
            path: altPath,
          })
        }
      }

      // Return placeholder if no logo found
      console.log("📝 Creating placeholder logo")
      return NextResponse.json({
        success: false,
        message: "Logo file not found",
        placeholder: createPlaceholderLogo(),
        searchedPaths: [logoPath, ...alternativePaths],
      })
    }
  } catch (error) {
    console.error("❌ Error in logo API:", error)
    return NextResponse.json({
      success: false,
      message: `Error reading logo file: ${error.message}`,
      placeholder: createPlaceholderLogo(),
    })
  }
}

function createPlaceholderLogo(): string {
  console.log("🎨 Creating SVG placeholder logo")
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
  const result = `data:image/svg+xml;base64,${base64Svg}`
  console.log("✅ Placeholder logo created, length:", result.length)
  return result
}
