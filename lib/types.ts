export interface CreateServiceRequest {
  title: string
  description: string
  fullDescription?: string
  rating?: number
  reviews?: number
  duration?: string
  image?: string
  slug: string
}

export interface CreateOrderRequest {
  items: Array<{
    id: string
    name: string
    category: string
    price: number
    quantity: number
  }>
  customerInfo: {
    name: string
    email: string
    phone: string
    address?: string
  }
  pickupDate?: string
  deliveryDate?: string
  specialInstructions?: string
}

export interface CartItem {
  id: string
  name: string
  category: string
  serviceType: string
  price: number
  quantity: number
}

export interface AddToCartRequest {
  item: {
    id: string
    name: string
    category: string
    price: number
    quantity?: number
  }
  sessionId?: string
}

export interface OrderTrackingStep {
  status: string
  label: string
  completed: boolean
  timestamp?: Date
}

export interface OrderTrackingData {
  orderId: string
  currentStatus: string
  customerInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  orderDetails: {
    totalAmount: number
    pickupDate?: string
    deliveryDate?: string
    specialInstructions?: string
    createdAt: string
    updatedAt: string
  }
  items: Array<{
    name: string
    category: string
    serviceType: string
    quantity: number
    price: number
  }>
  trackingSteps: OrderTrackingStep[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}
