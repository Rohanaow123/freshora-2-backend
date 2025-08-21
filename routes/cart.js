import express from "express"
import { body, param, validationResult } from "express-validator"
import { prisma } from "../lib/prisma.js"

const router = express.Router()

// Helper: format cart response
const formatCart = (cart) => {
  const items =
    cart?.items.map((item) => ({
      serviceItemId: item.serviceItem.id,
      name: item.serviceItem.name,
      category: item.serviceItem.category,
      serviceType: item.service.title,
      price: item.serviceItem.price,
      quantity: item.quantity,
    })) || []

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { items, totalItems, totalPrice }
}

// GET /api/cart - Fetch cart
router.get("/", async (req, res) => {
  try {
    const { sessionId = "default" } = req.query

    const cart = await prisma.cart.findUnique({
      where: { sessionId: String(sessionId) },
      include: { items: { include: { service: true, serviceItem: true } } },
    })

    res.json({ success: true, data: formatCart(cart) })
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ success: false, error: "Failed to fetch cart" })
  }
})

// POST /api/cart - Add item
router.post(
  "/",
  [
    body("item.id").notEmpty().withMessage("Item ID is required"),
    body("item.quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be >= 1"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

      const { item, sessionId = "default" } = req.body

      // Ensure cart exists
      const cart = await prisma.cart.upsert({
        where: { sessionId },
        update: {},
        create: { sessionId },
      })

      // Check serviceItem exists
      const serviceItem = await prisma.serviceItem.findUnique({
        where: { id: item.id },
      })
      if (!serviceItem) return res.status(404).json({ success: false, error: "Service item not found" })

      // Check if already in cart
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_serviceItemId: { cartId: cart.id, serviceItemId: item.id } },
      })

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + (item.quantity || 1) },
        })
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            serviceId: serviceItem.serviceId,
            serviceItemId: serviceItem.id,
            quantity: item.quantity || 1,
          },
        })
      }

      const updatedCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: { include: { service: true, serviceItem: true } } },
      })

      res.json({ success: true, data: formatCart(updatedCart), message: "Item added to cart" })
    } catch (error) {
      console.error("Error adding to cart:", error)
      res.status(500).json({ success: false, error: "Failed to add item to cart" })
    }
  }
)

// PUT /api/cart/:serviceItemId - Update quantity
router.put(
  "/:serviceItemId",
  [body("quantity").isInt({ min: 1 }).withMessage("Quantity must be >= 1")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

      const { serviceItemId } = req.params
      const { quantity, sessionId = "default" } = req.body

      const cart = await prisma.cart.findUnique({ where: { sessionId } })
      if (!cart) return res.status(404).json({ success: false, error: "Cart not found" })

      const cartItem = await prisma.cartItem.findUnique({
        where: { cartId_serviceItemId: { cartId: cart.id, serviceItemId } },
      })
      if (!cartItem) return res.status(404).json({ success: false, error: "Item not in cart" })

      await prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity } })

      res.json({ success: true, message: "Cart item updated" })
    } catch (error) {
      console.error("Error updating cart item:", error)
      res.status(500).json({ success: false, error: "Failed to update cart item" })
    }
  }
)

// DELETE /api/cart/:serviceItemId - Remove item
router.delete("/:serviceItemId", async (req, res) => {
  try {
    const { serviceItemId } = req.params
    const { sessionId = "default" } = req.query

    const cart = await prisma.cart.findUnique({ where: { sessionId } })
    if (!cart) return res.status(404).json({ success: false, error: "Cart not found" })

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, serviceItemId } })

    res.json({ success: true, message: "Item removed from cart" })
  } catch (error) {
    console.error("Error removing cart item:", error)
    res.status(500).json({ success: false, error: "Failed to remove item" })
  }
})

// DELETE /api/cart - Clear cart
router.delete("/", async (req, res) => {
  try {
    const { sessionId = "default" } = req.query

    const cart = await prisma.cart.findUnique({ where: { sessionId } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

    res.json({ success: true, message: "Cart cleared" })
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({ success: false, error: "Failed to clear cart" })
  }
})

export default router
