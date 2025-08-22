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
// GET /api/orders/:orderId - Get order by ID
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: {
            service: true,
            serviceItem: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});

// GET /api/orders - Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            service: true,
            serviceItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    })
  }
})

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

      const orderId = generateOrderId()

      const order = await prisma.order.create({
        data: {
          orderId, // Added orderId field
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
        // Don't fail the order creation if email fails
      }

      res.status(201).json({
        success: true,
        data: order,
      })
    } catch (error) {
      console.error("Error creating order:", error)
      res.status(500).json({
        success: false,
        error: "Failed to create order",
      })
    }
  },
)

export default router
