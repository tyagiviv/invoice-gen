// Simple logo test
async function testLogo() {
  console.log("🧪 Testing logo with simple approach...")

  try {
    // Test the API
    const response = await fetch("/api/logo")
    const data = await response.json()

    console.log("API Response:", {
      success: data.success,
      hasLogo: !!data.logo,
      logoLength: data.logo ? data.logo.length : 0,
    })

    if (data.logo) {
      // Test with jsPDF
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Clean the base64 data
      let logoData = data.logo
      if (logoData.startsWith("data:image/png;base64,")) {
        logoData = logoData.replace("data:image/png;base64,", "")
      }

      console.log("Cleaned logo data length:", logoData.length)

      // Try adding to PDF
      doc.addImage(logoData, "PNG", 20, 20, 50, 40)
      console.log("✅ Logo added to PDF successfully!")

      // Generate test PDF
      const pdfData = doc.output("datauristring")
      console.log("✅ Test PDF generated")

      // Create download link
      const link = document.createElement("a")
      link.href = pdfData
      link.download = "logo-test.pdf"
      link.textContent = "Download Logo Test PDF"
      link.style.cssText =
        "display:block;margin:10px;padding:10px;background:#007bff;color:white;text-decoration:none;border-radius:4px;"

      if (document.body) {
        document.body.appendChild(link)
        console.log("📎 Download link added to page")
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testLogo()
