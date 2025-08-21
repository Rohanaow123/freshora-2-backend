import express from "express"
import { body, validationResult, param } from "express-validator"
import { prisma } from "../lib/prisma.js"

const router = express.Router()

// ✅ GET /api/cart - Quick health/debug route
router.get("/", (req, res) => {
  res.json({ success: true, message: "Cart API is working 🚀" })
})

// ✅ GET /api/cart/:sessionId - Get or create cart by session ID
router.get(
  "/:sessionId",
  [param("sessionId").notEmpty().withMessage("Session ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const { sessionId } = req.params

      let cart = await prisma.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              service: true,
              serviceItem: true,
            },
          },
        },
      })

      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId },
          include: {
            items: {
              include: {
                service: true,
                serviceItem: true,
              },
            },
          },
        })
      }

      res.json({ success: true, data: cart })
    } catch (error) {
      console.error("Error fetching cart:", error)
      res.status(500).json({ success: false, error: "Failed to fetch cart" })
    }
  },
)

// ✅ POST /api/cart - Add item to cart
router.post(
  "/",
  [
    body("sessionId").notEmpty().withMessage("Session ID is required"),
    body("serviceId").isInt().withMessage("Service ID must be an integer"),
    body("serviceItemId").isInt().withMessage("Service item ID must be an integer"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const { sessionId, serviceId, serviceItemId, quantity } = req.body

      let cart = await prisma.cart.findUnique({ where: { sessionId } })
      if (!cart) {
        cart = await prisma.cart.create({ data: { sessionId } })
      }

      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_serviceItemId: {
            cartId: cart.id,
            serviceItemId,
          },
        },
      })

      let cartItem
      if (existingItem) {
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: { service: true, serviceItem: true },
        })
      } else {
        cartItem = await prisma.cartItem.create({
          data: { cartId: cart.id, serviceId, serviceItemId, quantity },
          include: { service: true, serviceItem: true },
        })
      }

      res.status(201).json({ success: true, data: cartItem })
    } catch (error) {
      console.error("Error adding to cart:", error)
      res.status(500).json({ success: false, error: "Failed to add to cart" })
    }
  },
)

// ✅ DELETE /api/cart/items/:id - Remove item
router.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params

    await prisma.cartItem.delete({ where: { id: Number(id) } })

    res.json({ success: true, message: "Item removed from cart" })
  } catch (error) {
    console.error("Error removing from cart:", error)
    res.status(500).json({ success: false, error: "Failed to remove from cart" })
  }
})

export default router
