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

      // Validate serviceId and serviceItemId for each item
      for (const item of items) {
        const serviceExists = await prisma.service.findUnique({ where: { id: item.serviceId } })
        if (!serviceExists) {
          return res.status(400).json({
            success: false,
            error: `Invalid serviceId: ${item.serviceId}`,
          })
        }

        const serviceItem = await prisma.serviceItem.findUnique({ where: { id: item.serviceItemId } })
        if (!serviceItem || serviceItem.serviceId !== item.serviceId) {
          return res.status(400).json({
            success: false,
            error: `Invalid serviceItemId: ${item.serviceItemId} for serviceId: ${item.serviceId}`,
          })
        }
      }

      const orderId = generateOrderId()

      const order = await prisma.order.create({
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
            create: items.map((item) => ({
              serviceId: item.serviceId,
              serviceItemId: item.serviceItemId,
              quantity: item.quantity,
              price: Number.parseFloat(item.price),
              totalPrice: Number.parseFloat(item.price) * item.quantity,
            })),
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

      // Send confirmation email (don't fail if email fails)
      try {
        await sendOrderConfirmationEmail({
          customerEmail,
          customerName,
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          items: order.items,
          pickupDate: order.pickupDate,
          deliveryDate: order.deliveryDate,
        })
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError)
      }

      res.status(201).json({
        success: true,
        data: order,
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
