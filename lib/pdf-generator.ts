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

    const response = await fetch(`${baseUrl}/api/logo`)

    if (response.ok) {
      const data = await response.json()
      console.log("Logo API response:", {
        success: data.success,
        hasLogo: !!data.logo,
        hasPlaceholder: !!data.placeholder,
      })

      if (data.success && data.logo) {
        // Clean the base64 data - remove data URI prefix for jsPDF
        let logoData = data.logo
        if (logoData.startsWith("data:image/png;base64,")) {
          logoData = logoData.replace("data:image/png;base64,", "")
        } else if (logoData.startsWith("data:image/jpeg;base64,")) {
          logoData = logoData.replace("data:image/jpeg;base64,", "")
        }

        cachedLogoBase64 = logoData
        console.log("✅ Logo loaded successfully, cleaned base64 length:", logoData.length)
        return cachedLogoBase64
      } else if (data.placeholder) {
        console.log("⚠️ Using placeholder logo from API")
        let placeholderData = data.placeholder
        if (placeholderData.startsWith("data:image/svg+xml;base64,")) {
          placeholderData = placeholderData.replace("data:image/svg+xml;base64,", "")
        }
        cachedLogoBase64 = placeholderData
        return cachedLogoBase64
      }
    }

    return null
  } catch (error) {
    console.log("❌ Error fetching logo:", error)
    return null
  }
}

export async function generatePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF()

  console.log("🚀 Starting PDF generation...")

  // Add logo with enhanced debugging
  try {
    const logoBase64 = await getLogoBase64()
    console.log("🖼️ Logo fetch result:", logoBase64 ? "Success" : "Failed")

    if (logoBase64) {
      try {
        const logoWidth = 45
        const logoHeight = 38

        console.log(`📸 Adding logo to PDF...`)
        console.log(`📸 Logo data type: ${typeof logoBase64}`)
        console.log(`📸 Logo data length: ${logoBase64.length}`)
        console.log(`📸 Logo data preview: ${logoBase64.substring(0, 50)}...`)

        // Clean the base64 data more thoroughly
        let cleanLogoData = logoBase64

        // Remove any data URI prefixes
        if (cleanLogoData.includes("data:image/")) {
          const base64Index = cleanLogoData.indexOf("base64,")
          if (base64Index !== -1) {
            cleanLogoData = cleanLogoData.substring(base64Index + 7)
          }
        }

        // Remove any whitespace or newlines
        cleanLogoData = cleanLogoData.replace(/\s/g, "")

        console.log(`📸 Cleaned logo data length: ${cleanLogoData.length}`)

        // Try different image formats
        const formats = ["PNG", "JPEG", "JPG"]
        let logoAdded = false

        for (const format of formats) {
          try {
            doc.addImage(cleanLogoData, format, 20, 15, logoWidth, logoHeight)
            console.log(`✅ Logo added successfully as ${format}!`)
            logoAdded = true
            break
          } catch (formatError) {
            console.log(`❌ ${format} format failed:`, formatError.message)
          }
        }

        if (!logoAdded) {
          throw new Error("All image formats failed")
        }
      } catch (logoError) {
        console.log("❌ Error adding logo to PDF:", logoError.message)
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
    console.log("❌ Error fetching logo:", logoFetchError.message)
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
