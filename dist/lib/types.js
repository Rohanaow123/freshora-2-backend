/**
 * @typedef {Object} CreateServiceRequest
 * @property {string} title
 * @property {string} description
 * @property {string} [fullDescription]
 * @property {number} [rating]
 * @property {number} [reviews]
 * @property {string} [duration]
 * @property {string} [image]
 * @property {string} slug
 */

/**
 * @typedef {Object} CreateOrderRequest
 * @property {Array<{id: string, name: string, category: string, price: number, quantity: number}>} items
 * @property {{name: string, email: string, phone: string, address?: string}} customerInfo
 * @property {string} [pickupDate]
 * @property {string} [deliveryDate]
 * @property {string} [specialInstructions]
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} serviceType
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @typedef {Object} AddToCartRequest
 * @property {{id: string, name: string, category: string, price: number, quantity?: number}} item
 * @property {string} [sessionId]
 */

/**
 * @typedef {Object} OrderTrackingStep
 * @property {string} status
 * @property {string} label
 * @property {boolean} completed
 * @property {Date} [timestamp]
 */

/**
 * @typedef {Object} OrderTrackingData
 * @property {string} orderId
 * @property {string} currentStatus
 * @property {{name: string, email: string, phone?: string, address?: string}} customerInfo
 * @property {{
 *   totalAmount: number,
 *   pickupDate?: string,
 *   deliveryDate?: string,
 *   specialInstructions?: string,
 *   createdAt: string,
 *   updatedAt: string
 * }} orderDetails
 * @property {Array<{name: string, category: string, serviceType: string, quantity: number, price: number}>} items
 * @property {OrderTrackingStep[]} trackingSteps
 */

/**
 * @typedef {Object} EmailResult
 * @property {boolean} success
 * @property {string} [messageId]
 * @property {string} [error]
 */
