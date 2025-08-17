import { prisma } from "../lib/prisma"

const serviceData = [
  {
    slug: "laundry-services",
    title: "Regular Laundry Services",
    description: "Professional washing and cleaning for everyday clothing",
    fullDescription:
      "Our regular laundry service provides thorough cleaning for all your everyday clothing items. We use premium detergents and fabric softeners to ensure your clothes come back fresh, clean, and soft.",
    rating: 5,
    reviews: 150,
    duration: "24-48 hours",
    image: "/placeholder.svg?height=300&width=400&text=Laundry+Service",
    items: {
      men: [
        { name: "T-Shirts", price: 3, description: "Cotton t-shirts, polo shirts" },
        { name: "Shirts (Formal)", price: 5, description: "Dress shirts, business shirts" },
        { name: "Pants/Trousers", price: 6, description: "Casual pants, formal trousers" },
        { name: "Jeans", price: 7, description: "Denim jeans, casual wear" },
        { name: "Suits", price: 15, description: "Two-piece suits, blazers" },
        { name: "Underwear", price: 2, description: "Undergarments, socks" },
      ],
      women: [
        { name: "T-Shirts/Tops", price: 3, description: "Casual tops, blouses" },
        { name: "Dresses", price: 8, description: "Casual and formal dresses" },
        { name: "Pants/Jeans", price: 6, description: "Trousers, jeans, leggings" },
        { name: "Skirts", price: 5, description: "Mini, midi, maxi skirts" },
        { name: "Blouses", price: 6, description: "Formal and casual blouses" },
        { name: "Underwear/Lingerie", price: 2, description: "Undergarments, bras" },
      ],
      children: [
        { name: "T-Shirts", price: 2, description: "Kids casual t-shirts" },
        { name: "Pants/Shorts", price: 3, description: "Kids pants and shorts" },
        { name: "Dresses", price: 4, description: "Girls dresses" },
        { name: "School Uniforms", price: 5, description: "School shirts, pants" },
        { name: "Pajamas", price: 3, description: "Sleepwear, nightwear" },
        { name: "Underwear", price: 1, description: "Kids undergarments" },
      ],
    },
  },
  {
    slug: "dry-cleaning-services",
    title: "Dry Cleaning Services",
    description: "Specialized dry cleaning for delicate and formal wear",
    fullDescription:
      "Professional dry cleaning service for your most delicate and valuable garments. Our expert team uses advanced dry cleaning techniques to preserve fabric quality and extend garment life.",
    rating: 5,
    reviews: 89,
    duration: "2-3 days",
    image: "/placeholder.svg?height=300&width=400&text=Dry+Cleaning",
    items: {
      men: [
        { name: "Suits", price: 20, description: "Two-piece business suits" },
        { name: "Blazers", price: 15, description: "Sport coats, blazers" },
        { name: "Dress Shirts", price: 8, description: "Formal dress shirts" },
        { name: "Ties", price: 5, description: "Neckties, bow ties" },
        { name: "Coats/Jackets", price: 25, description: "Winter coats, leather jackets" },
      ],
      women: [
        { name: "Dresses", price: 18, description: "Formal and cocktail dresses" },
        { name: "Blouses", price: 10, description: "Silk and delicate blouses" },
        { name: "Skirts", price: 12, description: "Formal and business skirts" },
        { name: "Coats", price: 30, description: "Winter coats, fur coats" },
        { name: "Evening Gowns", price: 35, description: "Formal evening wear" },
      ],
      children: [
        { name: "Formal Wear", price: 12, description: "Kids formal suits, dresses" },
        { name: "Coats", price: 15, description: "Kids winter coats" },
        { name: "School Blazers", price: 10, description: "School uniform blazers" },
      ],
    },
  },
  {
    slug: "express-laundry-services",
    title: "Express Laundry Services",
    description: "Fast turnaround laundry services for urgent needs",
    fullDescription:
      "When you need your laundry done quickly, our express service delivers. Choose from various speed options including same-day service for urgent requirements.",
    rating: 4,
    reviews: 67,
    duration: "6-24 hours",
    image: "/placeholder.svg?height=300&width=400&text=Express+Laundry",
    items: {
      "wash-and-fold": [
        {
          name: "Express Wash & Fold - 8hrs",
          unit: "Per KG",
          price: 60,
          description: "Fast wash and fold service completed within 8 hours",
        },
        {
          name: "Express Wash & Fold - 24hrs",
          unit: "Per KG",
          price: 30,
          description: "Wash and fold service completed within 24 hours",
        },
        {
          name: "Normal Wash & Fold",
          unit: "Per KG",
          price: 15,
          description: "Standard wash and fold service",
        },
      ],
      "wash-and-iron": [
        {
          name: "Express Wash & Iron - 6hrs",
          unit: "Per KG",
          price: 80,
          description: "Fast wash and iron service completed within 6 hours",
        },
        {
          name: "Express Wash & Iron - 24hrs",
          unit: "Per KG",
          price: 40,
          description: "Wash and iron service completed within 24 hours",
        },
        {
          name: "Normal Wash & Iron",
          unit: "Per KG",
          price: 20,
          description: "Standard wash and iron service",
        },
      ],
    },
  },
  {
    slug: "luxury-shoe-cleaning",
    title: "Luxury Shoe Cleaning",
    description: "Premium shoe cleaning and restoration services",
    fullDescription:
      "Specialized cleaning service for your valuable footwear. Our experts restore and maintain shoes using premium products and techniques.",
    rating: 5,
    reviews: 45,
    duration: "3-5 days",
    image: "/placeholder.svg?height=300&width=400&text=Shoe+Cleaning",
    items: {
      men: [
        {
          name: "Men's Leather Shoe Deep Clean",
          description: "Premium cleaning and conditioning for men's leather shoes to restore shine and remove dirt.",
          price: 350,
          image: "/images/shoes/men-leather.jpg",
        },
        {
          name: "Men's Suede Shoe Treatment",
          description: "Gentle suede cleaning to remove stains while preserving texture and color.",
          price: 400,
          image: "/images/shoes/men-suede.jpg",
        },
        {
          name: "Men's Sneakers Restoration",
          description: "Deep cleaning and whitening for men's sneakers, removing dirt and yellowing.",
          price: 300,
          image: "/images/shoes/men-sneakers.jpg",
        },
      ],
      women: [
        {
          name: "Women's High Heel Cleaning",
          description: "Specialized cleaning for delicate high heels and designer shoes.",
          price: 380,
          image: "/images/shoes/women-heels.jpg",
        },
        {
          name: "Women's Suede Boot Care",
          description: "Luxury treatment for suede boots, including stain removal and texture preservation.",
          price: 420,
          image: "/images/shoes/women-suede-boots.jpg",
        },
        {
          name: "Women's Designer Sneakers Cleaning",
          description: "Gentle yet effective cleaning for premium women's sneakers.",
          price: 350,
          image: "/images/shoes/women-sneakers.jpg",
        },
      ],
      children: [
        {
          name: "Kids' School Shoe Cleaning",
          description: "Durable and safe cleaning for children's school shoes.",
          price: 250,
          image: "/images/shoes/kids-school.jpg",
        },
        {
          name: "Kids' Sports Shoes Cleaning",
          description: "Deep cleaning for children's sports and activity shoes.",
          price: 220,
          image: "/images/shoes/kids-sports.jpg",
        },
        {
          name: "Kids' Party Shoes Shine",
          description: "Gentle cleaning for kids' formal and party shoes.",
          price: 260,
          image: "/images/shoes/kids-party.jpg",
        },
      ],
    },
  },
]

async function seedServices() {
  console.log("[v0] Starting database seeding...")

  try {
    // Clear existing data
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.serviceItem.deleteMany()
    await prisma.service.deleteMany()

    console.log("[v0] Cleared existing data")

    // Seed services and items
    for (const serviceInfo of serviceData) {
      const { items, ...serviceDetails } = serviceInfo

      // Create service
      const service = await prisma.service.create({
        data: serviceDetails,
      })

      console.log(`[v0] Created service: ${service.title}`)

      // Create service items
      for (const [category, categoryItems] of Object.entries(items)) {
        const typedCategoryItems = categoryItems as Array<{
          name: string
          description: string
          price: number
          unit?: string
          image?: string
        }>

        for (const item of typedCategoryItems) {
          await prisma.serviceItem.create({
            data: {
              serviceId: service.id,
              category,
              name: item.name,
              description: item.description,
              price: item.price,
              unit: item.unit || "Per Item",
              image: item.image,
            },
          })
        }
      }

      console.log(`[v0] Created ${Object.values(items).flat().length} items for ${service.title}`)
    }

    console.log("[v0] Database seeding completed successfully!")
  } catch (error) {
    console.error("[v0] Error seeding database:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedServices()
