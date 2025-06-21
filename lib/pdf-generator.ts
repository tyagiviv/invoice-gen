import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface InvoiceItem {
  description: string
  unitPrice: string
  quantity: string
  discount: string
  total: string
}

interface InvoiceData {
  invoiceNumber: number
  clientEmail?: string
  buyerName: string
  clientAddress: string
  regCode: string
  invoiceDate: string
  dueDate: string
  isPaid: boolean
  items: InvoiceItem[]
}

// Cache the logo to avoid repeated fetching
let cachedLogoBase64: string | null = null

async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) {
    console.log("Using cached logo")
    return cachedLogoBase64
  }

  try {
    console.log("Fetching logo from API...")

    // Determine the base URL for the API call
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"

    console.log("API Base URL:", baseUrl)

    const response = await fetch(`${baseUrl}/api/logo`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    console.log("Logo API response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("Logo API response data:", {
        success: data.success,
        hasLogo: !!data.logo,
        hasPlaceholder: !!data.placeholder,
        logoLength: data.logo ? data.logo.length : 0,
        logoStart: data.logo ? data.logo.substring(0, 50) : "none",
      })

      if (data.success && data.logo) {
        cachedLogoBase64 = data.logo
        console.log("✅ Logo loaded successfully from API, length:", data.logo.length)
        return cachedLogoBase64
      } else if (data.placeholder) {
        console.log("⚠️ Using placeholder logo from API")
        cachedLogoBase64 = data.placeholder
        return cachedLogoBase64
      }
    } else {
      console.log("❌ Logo API request failed:", response.status, response.statusText)
    }

    // Fallback to creating a placeholder
    console.log("Creating fallback placeholder logo")
    return createPlaceholderLogo()
  } catch (error) {
    console.log("❌ Error fetching logo:", error)
    return createPlaceholderLogo()
  }
}

// Create a simple placeholder logo as base64
function createPlaceholderLogo(): string {
  console.log("Creating placeholder logo...")
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

  // Use btoa for browser compatibility or Buffer for Node.js
  const base64Svg =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(svgLogo)))
      : Buffer.from(svgLogo).toString("base64")

  const result = `data:image/svg+xml;base64,${base64Svg}`
  console.log("Placeholder logo created, length:", result.length)
  return result
}

export async function generatePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF()

  console.log("🚀 Starting PDF generation...")

  // Add logo with extensive debugging
  try {
    console.log("📸 Attempting to get logo...")
    const logoBase64 = await getLogoBase64()

    if (logoBase64) {
      console.log("📸 Logo data received:", {
        length: logoBase64.length,
        type: logoBase64.substring(0, 30),
        isSVG: logoBase64.includes("data:image/svg"),
        isPNG: logoBase64.includes("data:image/png"),
      })

      try {
        const logoWidth = 45
        const logoHeight = 38

        // Determine image format from base64 string
        const imageFormat = logoBase64.includes("data:image/svg") ? "SVG" : "PNG"

        console.log(`📸 Adding logo to PDF with format: ${imageFormat}`)
        console.log(`📸 Logo dimensions: ${logoWidth}x${logoHeight} at position (20, 15)`)

        // Try adding the image
        doc.addImage(logoBase64, imageFormat, 20, 15, logoWidth, logoHeight)
        console.log("✅ Logo added to PDF successfully!")
      } catch (logoError) {
        console.log("❌ Error adding logo to PDF:", logoError)
        console.log("📸 Logo data that failed:", logoBase64.substring(0, 100))

        // Add text fallback
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("LapaDuu OÜ", 20, 30)
        console.log("📝 Added text fallback instead")
      }
    } else {
      console.log("❌ No logo data received")
      // Add text fallback
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("LapaDuu OÜ", 20, 30)
      console.log("📝 Added text fallback - no logo data")
    }
  } catch (logoFetchError) {
    console.log("❌ Error fetching logo:", logoFetchError)
    // Add text fallback
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("LapaDuu OÜ", 20, 30)
    console.log("📝 Added text fallback - fetch error")
  }

  // Add company name on the right
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("LapaDuu OÜ", 120, 30)

  // Add PAID label if invoice is paid
  if (data.isPaid) {
    doc.setTextColor(0, 128, 0) // Green color
    doc.setFontSize(16)
    doc.text("MAKSTUD", 120, 45)
    doc.setTextColor(0, 0, 0) // Reset to black
  }

  // Client information (left side)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  let yPos = 75
  doc.text(`Klient: ${data.buyerName}`, 20, yPos)
  doc.text(`Address: ${data.clientAddress}`, 20, yPos + 10)
  doc.text(`Reg kood: ${data.regCode}`, 20, yPos + 20)

  // Invoice details (right side)
  doc.text(`Arve nr: ${data.invoiceNumber}`, 120, yPos)
  doc.text(`Arve kuupäev: ${data.invoiceDate}`, 120, yPos + 10)
  doc.text(`Makse tähtaeg: ${data.dueDate}`, 120, yPos + 20)
  doc.text("Viivis: 0,15% päevas", 120, yPos + 30)

  // Items table
  yPos = 125
  const tableData = data.items.map((item) => {
    const hasDiscount = Number.parseFloat(item.discount) > 0
    const hasAnyDiscount = data.items.some((i) => Number.parseFloat(i.discount) > 0)

    if (hasAnyDiscount) {
      return [
        item.description,
        Number.parseFloat(item.unitPrice).toFixed(2),
        item.quantity,
        hasDiscount ? `${item.discount}%` : "",
        Number.parseFloat(item.total).toFixed(2),
      ]
    } else {
      return [
        item.description,
        Number.parseFloat(item.unitPrice).toFixed(2),
        item.quantity,
        Number.parseFloat(item.total).toFixed(2),
      ]
    }
  })

  const hasDiscounts = data.items.some((item) => Number.parseFloat(item.discount) > 0)
  const headers = hasDiscounts
    ? ["Teenus/kaup", "Ühiku hind", "Kogus/h", "Discount (%)", "Summa"]
    : ["Teenus/kaup", "Ühiku hind", "Kogus/h", "Summa"]

  // Use autoTable with proper import
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [200, 200, 200] },
  })

  // Calculate total
  const totalAmount = data.items.reduce((sum, item) => sum + Number.parseFloat(item.total), 0)

  // Add total and tax info
  const finalY = (doc as any).lastAutoTable.finalY + 20
  doc.text("Käibemaks: Ei ole KM kohuslane", 120, finalY)
  doc.setFont("helvetica", "bold")
  doc.text(`Arve summa kokku (EUR): ${totalAmount.toFixed(2)}`, 120, finalY + 10)
  doc.setFont("helvetica", "normal")

  // Add footer text
  doc.text("Palume arve tasumisel märkida selgitusse arve number.", 20, finalY + 30)
  doc.text("LapaDuu OÜ ei ole käibemaksukohuslane.", 20, finalY + 40)

  // Add footer with company details
  addFooter(doc)

  console.log("✅ PDF generation completed")
  return Buffer.from(doc.output("arraybuffer"))
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height
  const footerY = pageHeight - 40

  // Draw line
  doc.setLineWidth(0.5)
  doc.line(20, footerY, 190, footerY)

  // Footer content
  doc.setFontSize(8)
  doc.text("LapaDuu OÜ", 20, footerY + 10)
  doc.text("Reg.nr 14842122", 70, footerY + 10)
  doc.text("Swedbank: EE122200221072678443", 120, footerY + 10)

  doc.text("Pärnu mnt 129b-14, Tallinn", 20, footerY + 20)
  doc.text("Tel: +372 53702287", 70, footerY + 20)

  doc.text("Harjumaa, 11314", 20, footerY + 30)
  doc.setTextColor(0, 0, 255) // Blue color for email
  doc.text("email: lapaduu@lapaduu.ee", 70, footerY + 30)
  doc.setTextColor(0, 0, 0) // Reset to black
}
