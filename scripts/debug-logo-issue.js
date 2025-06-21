// Comprehensive logo debugging script
async function debugLogoIssue() {
  console.log("🔍 Starting comprehensive logo debugging...")

  // Test 1: Check if logo API is accessible
  console.log("\n📡 Test 1: Testing logo API accessibility...")
  try {
    const response = await fetch("/api/logo")
    console.log("API Response Status:", response.status)
    console.log("API Response OK:", response.ok)

    if (response.ok) {
      const data = await response.json()
      console.log("API Response Data:", {
        success: data.success,
        hasLogo: !!data.logo,
        hasPlaceholder: !!data.placeholder,
        logoLength: data.logo ? data.logo.length : 0,
        message: data.message,
      })

      // Test 2: Validate logo data format
      if (data.logo) {
        console.log("\n🖼️ Test 2: Validating logo data format...")
        console.log("Logo starts with:", data.logo.substring(0, 50))
        console.log("Is PNG:", data.logo.includes("data:image/png"))
        console.log("Is SVG:", data.logo.includes("data:image/svg"))
        console.log("Is JPEG:", data.logo.includes("data:image/jpeg"))

        // Test 3: Try to create an image element to validate
        console.log("\n🧪 Test 3: Testing logo in browser...")
        const img = new Image()
        img.onload = () => {
          console.log("✅ Logo loads successfully in browser")
          console.log("Image dimensions:", img.width, "x", img.height)
        }
        img.onerror = (error) => {
          console.log("❌ Logo fails to load in browser:", error)
        }
        img.src = data.logo

        // Test 4: Test jsPDF compatibility
        console.log("\n📄 Test 4: Testing jsPDF compatibility...")
        try {
          // Import jsPDF dynamically
          const { jsPDF } = await import("jspdf")
          const testDoc = new jsPDF()

          // Try to add the image
          const imageFormat = data.logo.includes("data:image/svg") ? "SVG" : "PNG"
          console.log("Detected format:", imageFormat)

          testDoc.addImage(data.logo, imageFormat, 10, 10, 50, 40)
          console.log("✅ Logo successfully added to test PDF")

          // Generate test PDF
          const pdfOutput = testDoc.output("datauristring")
          console.log("✅ Test PDF generated successfully")
          console.log("PDF data length:", pdfOutput.length)

          // Create download link for test PDF
          const link = document.createElement("a")
          link.href = pdfOutput
          link.download = "logo-test.pdf"
          link.textContent = "Download Test PDF"
          link.style.display = "block"
          link.style.margin = "10px 0"
          link.style.padding = "10px"
          link.style.background = "#007bff"
          link.style.color = "white"
          link.style.textDecoration = "none"
          link.style.borderRadius = "4px"

          // Add to page if possible
          if (document.body) {
            document.body.appendChild(link)
            console.log("📎 Test PDF download link added to page")
          }
        } catch (pdfError) {
          console.log("❌ jsPDF test failed:", pdfError)
        }
      }
    } else {
      console.log("❌ API request failed")
    }
  } catch (error) {
    console.log("❌ Error testing logo API:", error)
  }

  // Test 5: Check environment
  console.log("\n🌍 Test 5: Environment check...")
  console.log("Window exists:", typeof window !== "undefined")
  console.log("Current URL:", typeof window !== "undefined" ? window.location.href : "N/A")
  console.log("User Agent:", typeof navigator !== "undefined" ? navigator.userAgent : "N/A")

  console.log("\n🔍 Logo debugging completed!")
}

// Run the debug
debugLogoIssue()
