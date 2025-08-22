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

      // 🔹 Normalize serviceItemIds (strip combined IDs like serviceId-serviceItemId)
      const normalizedItems = items.map((item) => {
        let rawId = item.serviceItemId
        if (rawId.includes("-")) {
          const parts = rawId.split("-")
          rawId = parts[parts.length - 1] // always take the last part
        }
        return { ...item, serviceItemId: rawId }
      })

      const serviceItemIds = normalizedItems.map((i) => i.serviceItemId)

      const serviceItems = await prisma.serviceItem.findMany({
        where: { id: { in: serviceItemIds } },
      })

      if (serviceItems.length !== serviceItemIds.length) {
        const invalidIds = serviceItemIds.filter(
          (id) => !serviceItems.find((si) => si.id === id)
        )
        return res.status(400).json({
          success: false,
          error: `Invalid serviceItemIds: ${invalidIds.join(", ")}`,
        })
      }

      // Merge serviceId into items
      const itemsWithServiceId = normalizedItems.map((item) => {
        const si = serviceItems.find((si) => si.id === item.serviceItemId)
        return {
          serviceId: si.serviceId,
          serviceItemId: item.serviceItemId,
          quantity: item.quantity,
          price: Number.parseFloat(item.price),
          totalPrice: Number.parseFloat(item.price) * item.quantity,
        }
      })

      const orderId = generateOrderId()

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

      res.status(201).json({
        success: true,
        data: newOrder,
        message: "Order placed successfully! Check your email for tracking information.",
      })
    } catch (error) {
      console.error("Error creating order:", error)
      res.status(500).json({ success: false, error: "Failed to create order" })
    }
  }
)
