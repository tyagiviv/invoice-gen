import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

console.log("Checking logo file...")

const logoPath = join(process.cwd(), "public", "logo.png")
console.log("Logo path:", logoPath)

if (existsSync(logoPath)) {
  try {
    const logoBuffer = readFileSync(logoPath)
    console.log("✅ Logo file exists and is readable")
    console.log("📏 File size:", logoBuffer.length, "bytes")

    // Check if it's a valid PNG by looking at the header
    const pngHeader = logoBuffer.slice(0, 8)
    const expectedPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    if (pngHeader.equals(expectedPngHeader)) {
      console.log("✅ File appears to be a valid PNG")
    } else {
      console.log("⚠️  File may not be a valid PNG format")
      console.log("First 8 bytes:", pngHeader)
    }

    // Convert to base64 to test
    const base64 = logoBuffer.toString("base64")
    console.log("✅ Successfully converted to base64")
    console.log("📏 Base64 length:", base64.length)
  } catch (error) {
    console.log("❌ Error reading logo file:", error.message)
  }
} else {
  console.log("❌ Logo file does not exist at:", logoPath)
  console.log("📁 Creating a simple test logo...")

  // Create a simple 1x1 pixel PNG for testing
  const simplePng = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d, // IHDR chunk length
    0x49,
    0x48,
    0x44,
    0x52, // IHDR
    0x00,
    0x00,
    0x00,
    0x01, // width: 1
    0x00,
    0x00,
    0x00,
    0x01, // height: 1
    0x08,
    0x02,
    0x00,
    0x00,
    0x00, // bit depth, color type, compression, filter, interlace
    0x90,
    0x77,
    0x53,
    0xde, // CRC
    0x00,
    0x00,
    0x00,
    0x0c, // IDAT chunk length
    0x49,
    0x44,
    0x41,
    0x54, // IDAT
    0x08,
    0x99,
    0x01,
    0x01,
    0x00,
    0x00,
    0x00,
    0xff,
    0xff,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00,
    0x01, // data
    0xe2,
    0x21,
    0xbc,
    0x33, // CRC
    0x00,
    0x00,
    0x00,
    0x00, // IEND chunk length
    0x49,
    0x45,
    0x4e,
    0x44, // IEND
    0xae,
    0x42,
    0x60,
    0x82, // CRC
  ])

  try {
    writeFileSync(logoPath, simplePng)
    console.log("✅ Created test logo file")
  } catch (error) {
    console.log("❌ Failed to create test logo:", error.message)
  }
}

// Check current working directory
console.log("📁 Current working directory:", process.cwd())
console.log("📁 Public directory exists:", existsSync(join(process.cwd(), "public")))
