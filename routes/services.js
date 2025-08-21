import express from "express"
import { body, param, validationResult } from "express-validator"
import { prisma } from "../lib/prisma.js" // note the .js extension in ESM

const router = express.Router()

// GET /api/services - Get all services
router.get("/", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        items: true,
      },
    })

    const transformedServices = services.map((service) => ({
      ...service,
      items: service.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || "",
          unit: item.unit || "Per Item",
        })
        return acc
      }, {}),
    }))

    res.json({
      success: true,
      data: transformedServices,
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    res.status(500).json({ success: false, error: "Failed to fetch services" })
  }
})

// POST /api/services - Add a new service
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("slug").notEmpty().withMessage("Slug is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const body = req.body
      const { title, description, fullDescription, rating, reviews, duration, slug } = body

      const newService = await prisma.service.create({
        data: {
          slug,
          title,
          description,
          fullDescription: fullDescription || description,
          rating: rating || 5,
          reviews: reviews || 0,
          duration: duration || "24-48 hours",
        },
        include: {
          items: true,
        },
      })

      res.status(201).json({
        success: true,
        data: newService,
        message: "Service created successfully",
      })
    } catch (error) {
      console.error("Error creating service:", error)
      res.status(500).json({ success: false, error: "Failed to create service" })
    }
  },
)

// GET /api/services/:slug - Get service by slug
router.get("/:slug", [param("slug").notEmpty().withMessage("Slug is required")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    const { slug } = req.params

    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        items: true,
      },
    })

    if (!service) {
      return res.status(404).json({ success: false, error: "Service not found" })
    }

    const transformedService = {
      ...service,
      items: service.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || "",
          unit: item.unit || "Per Item",
        })
        return acc
      }, {}),
    }

    res.json({
      success: true,
      data: transformedService,
    })
  } catch (error) {
    console.error("Error fetching service:", error)
    res.status(500).json({ success: false, error: "Failed to fetch service" })
  }
})

// POST /api/services/:slug/items - Add item to service
router.post(
  "/:slug/items",
  [
    param("slug").notEmpty().withMessage("Slug is required"),
    body("name").notEmpty().withMessage("Item name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
  ],
  async (req, res) => {
    try {
      // validate request
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const { slug } = req.params
      const { name, category, price, description, unit } = req.body

      // find parent service
      const service = await prisma.service.findUnique({
        where: { slug },
      })

      if (!service) {
        return res.status(404).json({ success: false, error: "Service not found" })
      }

      // create item
      const newItem = await prisma.serviceItem.create({
        data: {
          serviceId: service.id,
          name,
          category,
          price: Number.parseFloat(price),
          description: description || null,
          unit: unit || "Per Item",
        },
      })

      res.status(201).json({
        success: true,
        data: newItem,
        message: `Item added successfully to service '${slug}'`,
      })
    } catch (error) {
      console.error("Error adding item:", error)
      res.status(500).json({ success: false, error: "Failed to add item" })
    }
  },
)

export default router
