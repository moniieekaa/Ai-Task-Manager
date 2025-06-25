import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { authRoutes } from "./routes/auth"
import { taskRoutes } from "./routes/tasks"
import { aiRoutes } from "./routes/ai"
import { errorHandler } from "./middleware/errorHandler"
import type { Env } from "./types/env"

// Load environment variables
import dotenv from "dotenv"
dotenv.config()

const app = new OpenAPIHono<Env>()

// Error handling middleware
app.onError(errorHandler)

// Middleware
app.use("*", logger())
app.use("*", prettyJSON())
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://ai-task-manager-hazel.vercel.app/"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
)

// Health check route
const healthRoute = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      description: "Health check response",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(healthRoute, (c) => {
  return c.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.route("/api/auth", authRoutes)
app.route("/api/tasks", taskRoutes)
app.route("/api/ai", aiRoutes)

// Swagger UI
app.get("/docs", swaggerUI({ url: "/doc" }))

// OpenAPI JSON
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Task Manager API",
    description: "A task management API with AI-powered task generation",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server",
    },
    {
      url: "https://your-backend-url.onrender.com",
      description: "Production server",
    },
  ],
})

const port = Number(process.env.PORT) || 5000

console.log(`🚀 Server is running on port ${port}`)
console.log(`📚 API Documentation available at http://localhost:${port}/docs`)
console.log(`🗄️ Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`)
console.log(`🤖 Google AI: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Configured" : "Not configured"}`)

serve({
  fetch: app.fetch,
  port,
})
