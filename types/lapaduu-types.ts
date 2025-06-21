// Type definitions for LapaDuu integration

export interface LapaDuuProduct {
  id: string
  name: string
  nameEt: string // Estonian name
  price: number
  category: "food-wraps" | "accessories" | "gift-sets"
  sizes?: string[] // e.g., ['Small', 'Medium', 'Large']
  patterns?: string[] // Different fabric patterns
  inStock: boolean
}

export interface LapaDuuCartState {
  items: Array<{
    productId: string
    productName: string
    productNameEt: string
    price: number
    quantity: number
    size?: string
    pattern?: string
  }>
  totalItems: number
  totalAmount: number
  currency: "EUR"
}

export interface LapaDuuCustomer {
  email: string
  firstName: string
  lastName: string
  phone?: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  language: "et" | "en" // Estonian or English
}
