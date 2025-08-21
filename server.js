import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Import routes
import servicesRouter from "./routes/services.js"
import ordersRouter from "./routes/orders.js"
import cartRouter from "./routes/cart.js"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
})
app.use(limiter)

// Logging
app.use(morgan("combined"))

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Root endpoint (for quick check in browser)
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Freshora Backend API is running",
    health: "/health",
    endpoints: ["/api/services", "/api/orders", "/api/cart"],
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// API routes
app.use("/api/services", servicesRouter)
app.use("/api/orders", ordersRouter)
app.use("/api/cart", cartRouter)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Route not found" })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  })
})

// Start server only in local/dev mode
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}

export default app
