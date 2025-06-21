import InvoiceForm from "@/components/invoice-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <h1 className="text-3xl font-bold text-gray-900">LapaDuu OÜ</h1>
              <Link href="/dashboard">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <p className="text-gray-600 mt-2">Invoice Generator</p>
          </div>
          <InvoiceForm />
        </div>
      </div>
    </div>
  )
}
