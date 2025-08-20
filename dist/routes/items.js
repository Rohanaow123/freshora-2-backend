const express = require("express")
const { prisma } = require("../lib/prisma") // adjust path if needed

const router = express.Router()

// GET /api/items - Get all items (optionally filter by serviceId)
router.get("/", async (req, res) => {
  try {
    const { serviceId } = req.query

    const items = await prisma.serviceItem.findMany({
      where: serviceId ? { serviceId: Number(serviceId) } : {},
    })

    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, error: "No items found" })
    }

    res.json({ success: true, data: items })
  } catch (error) {
    console.error("Error fetching items:", error)
    res.status(500).json({ success: false, error: "Failed to fetch items" })
  }
})

// POST /api/items - Add new item
router.post("/", async (req, res) => {
  try {
    const { serviceId, category, name, description, price, unit, image } = req.body

    if (!serviceId || !category || !name || !price) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: serviceId, category, name, price",
      })
    }

    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } })
    if (!service) {
      return res.status(404).json({ success: false, error: "Service not found" })
    }

    const newItem = await prisma.serviceItem.create({
      data: {
        serviceId: Number(serviceId),
        category,
        name,
        description: description || "",
        price,
        unit: unit || "Per Item",
        image,
      },
    })

    res.status(201).json({
      success: true,
      data: newItem,
      message: "Item added successfully",
    })
  } catch (error) {
    console.error("Error adding item:", error)
    res.status(500).json({ success: false, error: "Failed to add item" })
  }
})

// PUT /api/items/bulk - Add multiple items
router.put("/bulk", async (req, res) => {
  try {
    const { serviceId, items } = req.body

    if (!serviceId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "ServiceId and items array are required",
      })
    }

    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } })
    if (!service) {
      return res.status(404).json({ success: false, error: "Service not found" })
    }

    for (const item of items) {
      if (!item.category || !item.name || !item.price) {
        return res.status(400).json({
          success: false,
          error: "Each item must have category, name, and price",
        })
      }
    }

    const newItems = await prisma.$transaction(
      items.map((item) =>
        prisma.serviceItem.create({
          data: {
            serviceId: Number(serviceId),
            category: item.category,
            name: item.name,
            description: item.description || "",
            price: item.price,
            unit: item.unit || "Per Item",
            image: item.image,
          },
        })
      )
    )

    res.status(201).json({
      success: true,
      data: newItems,
      message: `${newItems.length} items added successfully`,
    })
  } catch (error) {
    console.error("Error adding bulk items:", error)
    res.status(500).json({ success: false, error: "Failed to add bulk items" })
  }
})

module.exports = router
