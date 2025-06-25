import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import jwt from "jsonwebtoken"
import type { Env } from "../types/env"

const app = new OpenAPIHono<Env>()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

const generateTasksRequestSchema = z.object({
  topic: z.string().min(1).max(200),
})

const generateTasksResponseSchema = z.object({
  tasks: z.array(z.string()),
  topic: z.string(),
})

// Middleware to verify JWT token
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    c.set("user", decoded)
    await next()
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401)
  }
}

const generateTasksRoute = createRoute({
  method: "post",
  path: "/generate-tasks",
  request: {
    body: {
      content: {
        "application/json": {
          schema: generateTasksRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tasks generated successfully",
      content: {
        "application/json": {
          schema: generateTasksResponseSchema,
        },
      },
    },
  },
})

app.use("*", requireAuth)

app.openapi(generateTasksRoute, async (c) => {
  const { topic } = await c.req.json()

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    // For OpenAPI compliance, we throw an error instead of returning error response
    throw new Error("Google AI API key not configured")
  }

  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Generate a list of 5 concise, actionable tasks to learn about or accomplish: "${topic}". 

Requirements:
- Each task should be specific and actionable
- Tasks should be realistic and achievable
- Return only the tasks, one per line
- No numbering, bullets, or extra formatting
- Each task should be a complete sentence

Example format:
Research the fundamentals of Python programming
Set up a Python development environment
Complete a beginner Python tutorial
Build a simple calculator project
Join a Python community or forum`,
    })

    // Parse the generated text into individual tasks
    const tasks = text
      .split("\n")
      .map((task) => task.trim())
      .filter((task) => task.length > 0)
      .slice(0, 5) // Ensure we only get 5 tasks

    return c.json({ tasks, topic })
  } catch (error) {
    console.error("Task generation error:", error)
    throw error
  }
})

export { app as aiRoutes }
