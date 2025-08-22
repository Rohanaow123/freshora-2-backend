import express from "express"
import { body, validationResult } from "express-validator"
import { prisma } from "../lib/prisma.js"
import { sendOrderConfirmationEmail } from "../lib/email.js"

const router = express.Router()

function generateOrderId() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp}-${randomStr}`
}

// POST /api/orders - Create new order
router.post(
  "/",
  [
    body("customerName").notEmpty().withMessage("Customer name is required"),
    body("customerEmail").isEmail().withMessage("Valid email is required"),
    body("totalAmount").isFloat({ gt: 0 }).withMessage("Total amount must be positive"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        totalAmount,
        items,
        notes,
        pickupDate,
        deliveryDate,
        specialInstructions,
      } = req.body

      // 1️⃣ Lookup all serviceItems for given IDs
      const serviceItemIds = items.map(item => item.serviceItemId)
      const serviceItems = await prisma.serviceItem.findMany({
        where: { id: { in: serviceItemIds } },
      })

      if (serviceItems.length !== serviceItemIds.length) {
        const invalidIds = serviceItemIds.filter(
          id => !serviceItems.find(si => si.id === id)
        )
        return res.status(400).json({
          success: false,
          error: `Invalid serviceItemIds: ${invalidIds.join(", ")}`,
        })
      }

      // 2️⃣ Merge serviceId into items for order creation
      const itemsWithServiceId = items.map(item => {
        const si = serviceItems.find(si => si.id === item.serviceItemId)
        return {
          serviceId: si.serviceId,
          serviceItemId: item.serviceItemId,
          quantity: item.quantity,
          price: Number.parseFloat(item.price),
          totalPrice: Number.parseFloat(item.price) * item.quantity,
        }
      })

      // 3️⃣ Generate order ID
      const orderId = generateOrderId()

      // 4️⃣ Create the order
      const newOrder = await prisma.order.create({
        data: {
          orderId,
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          totalAmount: Number.parseFloat(totalAmount),
          status: "PENDING",
          notes,
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          specialInstructions,
          items: {
            create: itemsWithServiceId,
          },
        },
        include: {
          items: {
            include: {
              service: true,
              serviceItem: true,
            },
          },
        },
      })

      // 5️⃣ Send confirmation email (don't fail if email fails)
      try {
        await sendOrderConfirmationEmail({
          customerEmail,
          customerName,
          orderId: newOrder.orderId,
          totalAmount: newOrder.totalAmount,
          items: newOrder.items,
          pickupDate: newOrder.pickupDate,
          deliveryDate: newOrder.deliveryDate,
        })
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError)
      }

      // 6️⃣ Return response
      res.status(201).json({
        success: true,
        data: newOrder,
        message: "Order placed successfully! Check your email for tracking information.",
      })
    } catch (error) {
      console.error("Error creating order:", error)
      res.status(500).json({
        success: false,
        error: "Failed to create order",
      })
    }
  }
)

export default router
