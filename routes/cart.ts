import express from "express"
import { body, param, validationResult } from "express-validator"
import { prisma } from "../lib/prisma"
import type { AddToCartRequest } from "../lib/types"

const router = express.Router()

// GET /api/cart - Get cart items
router.get("/", async (req, res) => {
  try {
    const { sessionId = "default" } = req.query

    const cart = await prisma.cart.findUnique({
      where: { sessionId: sessionId as string },
      include: {
        items: {
          include: {
            service: true,
            serviceItem: true,
          },
        },
      },
    })

    const cartItems =
      cart?.items.map((item) => ({
        id: item.serviceItem.id,
        name: item.serviceItem.name,
        category: item.serviceItem.category,
        serviceType: item.service.title,
        price: item.serviceItem.price,
        quantity: item.quantity,
      })) || []

    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0)
    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

    res.json({
      success: true,
      data: {
        items: cartItems,
        totalItems,
        totalPrice,
      },
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ success: false, error: "Failed to fetch cart" })
  }
})

// POST /api/cart - Add item to cart
router.post(
  "/",
  [
    body("item.id").notEmpty().withMessage("Item ID is required"),
    body("item.name").notEmpty().withMessage("Item name is required"),
    body("item.price").isNumeric().withMessage("Item price must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const body: AddToCartRequest = req.body
      const { item, sessionId = "default" } = body

      const cart = await prisma.cart.upsert({
        where: { sessionId },
        update: {},
        create: { sessionId },
      })

      // Check if item already exists in cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          cartId_serviceItemId: {
            cartId: cart.id,
            serviceItemId: item.id,
          },
        },
      })

      if (existingCartItem) {
        // Update existing item quantity
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + (item.quantity || 1),
          },
        })
      } else {
        // Find the service item to get service ID
        const serviceItem = await prisma.serviceItem.findUnique({
          where: { id: item.id },
        })

        if (!serviceItem) {
          return res.status(404).json({ success: false, error: "Service item not found" })
        }

        // Add new item to cart
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            serviceId: serviceItem.serviceId,
            serviceItemId: serviceItem.id,
            quantity: item.quantity || 1,
          },
        })
      }

      // Return updated cart
      const updatedCart = await prisma.cart.findUnique({
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

      const cartItems =
        updatedCart?.items.map((item) => ({
          id: item.serviceItem.id,
          name: item.serviceItem.name,
          category: item.serviceItem.category,
          serviceType: item.service.title,
          price: item.serviceItem.price,
          quantity: item.quantity,
        })) || []

      res.json({
        success: true,
        data: cartItems,
        message: "Item added to cart successfully",
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      res.status(500).json({ success: false, error: "Failed to add item to cart" })
    }
  },
)

// PUT /api/cart/:itemId - Update cart item quantity
router.put(
  "/:itemId",
  [
    param("itemId").notEmpty().withMessage("Item ID is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const { itemId } = req.params
      const { quantity, sessionId = "default" } = req.body

      const cart = await prisma.cart.findUnique({
        where: { sessionId },
      })

      if (!cart) {
        return res.status(404).json({ success: false, error: "Cart not found" })
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: {
          cartId_serviceItemId: {
            cartId: cart.id,
            serviceItemId: itemId,
          },
        },
      })

      if (!cartItem) {
        return res.status(404).json({ success: false, error: "Item not found in cart" })
      }

      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      })

      res.json({
        success: true,
        message: "Cart item updated successfully",
      })
    } catch (error) {
      console.error("Error updating cart item:", error)
      res.status(500).json({ success: false, error: "Failed to update cart item" })
    }
  },
)

// DELETE /api/cart/:itemId - Remove item from cart
router.delete("/:itemId", [param("itemId").notEmpty().withMessage("Item ID is required")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    const { itemId } = req.params
    const { sessionId = "default" } = req.query

    const cart = await prisma.cart.findUnique({
      where: { sessionId: sessionId as string },
    })

    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" })
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        serviceItemId: itemId,
      },
    })

    res.json({
      success: true,
      message: "Item removed from cart successfully",
    })
  } catch (error) {
    console.error("Error removing cart item:", error)
    res.status(500).json({ success: false, error: "Failed to remove cart item" })
  }
})

// DELETE /api/cart - Clear entire cart
router.delete("/", async (req, res) => {
  try {
    const { sessionId = "default" } = req.query

    const cart = await prisma.cart.findUnique({
      where: { sessionId: sessionId as string },
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      })
    }

    res.json({
      success: true,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({ success: false, error: "Failed to clear cart" })
  }
})

export default router
