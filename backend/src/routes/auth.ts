import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import jwt from "jsonwebtoken"
import type { Env } from "../types/env"

const app = new OpenAPIHono<Env>()

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

const userSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const syncUserRequestSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string(),
})

const syncUserResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
})

const errorResponseSchema = z.object({
  error: z.string(),
})

// Middleware to verify JWT token
const verifyToken = async (c: any, next: any) => {
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

const syncUserRoute = createRoute({
  method: "post",
  path: "/sync",
  request: {
    body: {
      content: {
        "application/json": {
          schema: syncUserRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User synced successfully",
      content: {
        "application/json": {
          schema: syncUserResponseSchema,
        },
      },
    },
  },
})

app.openapi(syncUserRoute, async (c) => {
  try {
    const { clerkId, email, name } = await c.req.json()

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)

    let user
    if (existingUser.length > 0) {
      user = existingUser[0]
    } else {
      // Create new user
      const newUsers = await db
        .insert(users)
        .values({
          clerkId,
          email,
          name,
        })
        .returning()
      user = newUsers[0]
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id, clerkId: user.clerkId, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    })

    // Convert Date objects to ISO strings
    const userResponse = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    return c.json({ user: userResponse, token })
  } catch (error) {
    console.error("Auth sync error:", error)
    // For OpenAPI compliance, we need to handle errors differently
    // This will be a 500 error but we can't define it in the OpenAPI schema
    // In a real app, you might want to use a separate error handling middleware
    throw error
  }
})

const getMeRoute = createRoute({
  method: "get",
  path: "/me",
  responses: {
    200: {
      description: "Current user information",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
  },
})

// Use regular route for /me to handle errors properly
app.use("/me", verifyToken)
app.get("/me", async (c) => {
  try {
    const userInfo = c.get("user")

    const user = await db.select().from(users).where(eq(users.id, userInfo.userId)).limit(1)

    if (user.length === 0) {
      return c.json({ error: "User not found" }, 404)
    }

    // Convert Date objects to ISO strings
    const userResponse = {
      ...user[0],
      createdAt: user[0].createdAt.toISOString(),
      updatedAt: user[0].updatedAt.toISOString(),
    }

    return c.json(userResponse)
  } catch (error) {
    console.error("Get user error:", error)
    return c.json({ error: "Failed to get user" }, 500)
  }
})

export { app as authRoutes }
