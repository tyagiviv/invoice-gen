// Test the logo API endpoint
async function testLogoAPI() {
  try {
    console.log("Testing logo API endpoint...")

    const response = await fetch("/api/logo")
    const data = await response.json()

    console.log("API Response:", {
      status: response.status,
      success: data.success,
      hasLogo: !!data.logo,
      hasPlaceholder: !!data.placeholder,
      message: data.message,
      logoSize: data.size,
    })

    if (data.success && data.logo) {
      console.log("✅ Logo loaded successfully!")
      console.log("📏 Logo data length:", data.logo.length)
      console.log("🖼️ Logo format:", data.logo.substring(0, 30) + "...")
    } else if (data.placeholder) {
      console.log("⚠️ Using placeholder logo")
      console.log("📏 Placeholder data length:", data.placeholder.length)
    } else {
      console.log("❌ No logo or placeholder available")
    }

    return data
  } catch (error) {
    console.error("❌ Error testing logo API:", error)
    return null
  }
}

// Run the test
testLogoAPI()
