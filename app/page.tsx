import InvoiceForm from "@/components/invoice-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">LapaDuu OÜ</h1>
            <p className="text-gray-600 mt-2">Invoice Generator</p>
          </div>
          <InvoiceForm />
        </div>
      </div>
    </div>
  )
}
