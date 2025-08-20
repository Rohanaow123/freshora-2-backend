import express from "express"
import { body, param, validationResult } from "express-validator"
import { prisma } from "../lib/prisma.js"
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from "../lib/email.js"

const router = express.Router()

// GET /api/orders - Get all orders with optional filtering
router.get("/", async (req, res) => {
  try {
    const { status, customerEmail, limit } = req.query

    const whereClause = {}

    if (status) {
      whereClause.status = String(status).toUpperCase()
    }

    if (customerEmail) {
      whereClause.customerEmail = customerEmail
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            service: true,
            serviceItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
    })

    const transformedOrders = orders.map((order) => ({
      id: order.id,
      items: order.items.map((item) => ({
        id: item.serviceItem.id,
        name: item.serviceItem.name,
        category: item.serviceItem.category,
        serviceType: item.service.title,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      status: order.status.toLowerCase(),
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone || "",
        address: order.customerAddress || "",
      },
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }))

    res.json({ success: true, data: transformedOrders, total: transformedOrders.length })
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ success: false, error: "Failed to fetch orders" })
  }
})

// POST /api/orders - Create a new order
router.post(
  "/",
  [
    body("items").isArray({ min: 1 }).withMessage("Items array is required and cannot be empty"),
    body("customerInfo.name").notEmpty().withMessage("Customer name is required"),
    body("customerInfo.email").isEmail().withMessage("Valid email is required"),
    body("customerInfo.phone").notEmpty().withMessage("Phone number is required"),
    body("pickupDate").optional().isISO8601().withMessage("Invalid pickup date format"),
    body("deliveryDate").optional().isISO8601().withMessage("Invalid delivery date format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const { items, customerInfo, pickupDate, deliveryDate, specialInstructions } = req.body

      const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0)

      const newOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            customerAddress: customerInfo.address,
            totalAmount,
            status: "PENDING",
            pickupDate: pickupDate ? new Date(pickupDate) : null,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            specialInstructions: specialInstructions || null,
          },
        })

        for (const item of items) {
          const serviceItem = await tx.serviceItem.findUnique({
            where: { id: item.id },
            include: { service: true },
          })

          if (serviceItem) {
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                serviceId: serviceItem.serviceId,
                serviceItemId: serviceItem.id,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.price * item.quantity,
              },
            })
          }
        }

        return order
      })

      const emailResult = await sendOrderConfirmationEmail({
        id: newOrder.id,
        customerName: newOrder.customerName,
        customerEmail: newOrder.customerEmail,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        pickupDate: newOrder.pickupDate?.toISOString().split("T")[0],
        deliveryDate: newOrder.deliveryDate?.toISOString().split("T")[0],
      })

      res.status(201).json({
        success: true,
        data: {
          id: newOrder.id,
          totalAmount: newOrder.totalAmount,
          status: newOrder.status.toLowerCase(),
          customerInfo,
          pickupDate: newOrder.pickupDate?.toISOString(),
          deliveryDate: newOrder.deliveryDate?.toISOString(),
          createdAt: newOrder.createdAt.toISOString(),
          updatedAt: newOrder.updatedAt.toISOString(),
        },
        message: "Order created successfully",
        emailSent: emailResult.success,
      })
    } catch (error) {
      console.error("Error creating order:", error)
      res.status(500).json({ success: false, error: "Failed to create order" })
    }
  },
)

// GET /api/orders/:id - Get order by ID
router.get("/:id", [param("id").notEmpty().withMessage("Order ID is required")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: true,
            serviceItem: true,
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    const transformedOrder = {
      id: order.id,
      items: order.items.map((item) => ({
        id: item.serviceItem.id,
        name: item.serviceItem.name,
        category: item.serviceItem.category,
        serviceType: item.service.title,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      status: order.status.toLowerCase(),
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone || "",
        address: order.customerAddress || "",
      },
      pickupDate: order.pickupDate?.toISOString(),
      deliveryDate: order.deliveryDate?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }

    res.json({ success: true, data: transformedOrder })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ success: false, error: "Failed to fetch order" })
  }
})

// PUT /api/orders/:id - Update order status
router.put(
  "/:id",
  [
    param("id").notEmpty().withMessage("Order ID is required"),
    body("status")
      .isIn(["pending", "confirmed", "processing", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"])
      .withMessage("Invalid status"),
    body("pickupDate").optional().isISO8601().withMessage("Invalid pickup date format"),
    body("deliveryDate").optional().isISO8601().withMessage("Invalid delivery date format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const { id } = req.params
      const { status, pickupDate, deliveryDate } = req.body

      const currentOrder = await prisma.order.findUnique({ where: { id } })
      if (!currentOrder) {
        return res.status(404).json({ success: false, error: "Order not found" })
      }

      const updateData = { status: status.toUpperCase() }
      if (pickupDate) updateData.pickupDate = new Date(pickupDate)
      if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate)

      const updatedOrder = await prisma.order.update({ where: { id }, data: updateData })

      if (currentOrder.status !== updatedOrder.status) {
        await sendOrderStatusUpdateEmail(
          {
            id: updatedOrder.id,
            customerName: updatedOrder.customerName,
            customerEmail: updatedOrder.customerEmail,
          },
          status,
        )
      }

      res.json({
        success: true,
        data: {
          id: updatedOrder.id,
          status: updatedOrder.status.toLowerCase(),
          pickupDate: updatedOrder.pickupDate?.toISOString(),
          deliveryDate: updatedOrder.deliveryDate?.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString(),
        },
        message: "Order status updated successfully",
      })
    } catch (error) {
      console.error("Error updating order:", error)
      res.status(500).json({ success: false, error: "Failed to update order" })
    }
  },
)

// GET /api/orders/track/:id - Track order
router.get("/track/:id", [param("id").notEmpty().withMessage("Order ID is required")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    const { id } = req.params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: true,
            serviceItem: true,
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    const trackingSteps = [
      { status: "pending", label: "Order Placed", completed: true, timestamp: order.createdAt },
      {
        status: "confirmed",
        label: "Order Confirmed",
        completed: ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"].includes(order.status),
      },
      {
        status: "processing",
        label: "In Processing",
        completed: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"].includes(order.status),
      },
      {
        status: "ready_for_pickup",
        label: "Ready for Pickup",
        completed: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"].includes(order.status),
      },
      {
        status: "out_for_delivery",
        label: "Out for Delivery",
        completed: ["OUT_FOR_DELIVERY", "COMPLETED"].includes(order.status),
      },
      { status: "completed", label: "Completed", completed: order.status === "COMPLETED" },
    ]

    const trackingData = {
      orderId: order.id,
      currentStatus: order.status.toLowerCase(),
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.customerAddress,
      },
      orderDetails: {
        totalAmount: order.totalAmount,
        pickupDate: order.pickupDate?.toISOString(),
        deliveryDate: order.deliveryDate?.toISOString(),
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
      items: order.items.map((item) => ({
        name: item.serviceItem.name,
        category: item.serviceItem.category,
        serviceType: item.service.title,
        quantity: item.quantity,
        price: item.price,
      })),
      trackingSteps,
    }

    res.json({ success: true, data: trackingData })
  } catch (error) {
    console.error("Error tracking order:", error)
    res.status(500).json({ success: false, error: "Failed to track order" })
  }
})

export default router
