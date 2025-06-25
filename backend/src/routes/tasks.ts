import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { db } from "../db"
import { tasks, users } from "../db/schema"
import { eq, and, desc } from "drizzle-orm"
import jwt from "jsonwebtoken"
import type { Env } from "../types/env"

const app = new OpenAPIHono<Env>()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  completed: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  category: z.string().default("personal"),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  completed: z.boolean().optional(),
})

const bulkCreateRequestSchema = z.object({
  tasks: z.array(createTaskSchema),
})

const bulkCreateResponseSchema = z.object({
  message: z.string(),
  count: z.number(),
})

const deleteResponseSchema = z.object({
  message: z.string(),
})

// Middleware to verify JWT token and get user
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1)

    if (user.length === 0) {
      return c.json({ error: "User not found" }, 404)
    }

    c.set("currentUser", user[0])
    await next()
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401)
  }
}

app.use("*", requireAuth)

const getTasksRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "List of tasks",
      content: {
        "application/json": {
          schema: z.array(taskSchema),
        },
      },
    },
  },
})

app.openapi(getTasksRoute, async (c) => {
  const currentUser = c.get("currentUser")

  try {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, currentUser.id))
      .orderBy(desc(tasks.createdAt))

    // Convert Date objects to ISO strings
    const tasksResponse = userTasks.map((task) => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))

    return c.json(tasksResponse)
  } catch (error) {
    console.error("Get tasks error:", error)
    throw error
  }
})

const createTaskRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createTaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Task created successfully",
      content: {
        "application/json": {
          schema: taskSchema,
        },
      },
    },
  },
})

app.openapi(createTaskRoute, async (c) => {
  const currentUser = c.get("currentUser")
  const taskData = await c.req.json()

  try {
    const newTask = await db
      .insert(tasks)
      .values({
        ...taskData,
        userId: currentUser.id,
      })
      .returning()

    // Convert Date objects to ISO strings
    const taskResponse = {
      ...newTask[0],
      createdAt: newTask[0].createdAt.toISOString(),
      updatedAt: newTask[0].updatedAt.toISOString(),
    }

    return c.json(taskResponse, 201)
  } catch (error) {
    console.error("Create task error:", error)
    throw error
  }
})

const bulkCreateTasksRoute = createRoute({
  method: "post",
  path: "/bulk",
  request: {
    body: {
      content: {
        "application/json": {
          schema: bulkCreateRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Tasks created successfully",
      content: {
        "application/json": {
          schema: bulkCreateResponseSchema,
        },
      },
    },
  },
})

app.openapi(bulkCreateTasksRoute, async (c) => {
  const currentUser = c.get("currentUser")
  const { tasks: taskList } = await c.req.json()

  try {
    const tasksToInsert = taskList.map((task: any) => ({
      ...task,
      userId: currentUser.id,
    }))

    await db.insert(tasks).values(tasksToInsert)

    return c.json(
      {
        message: "Tasks created successfully",
        count: tasksToInsert.length,
      },
      201,
    )
  } catch (error) {
    console.error("Bulk create tasks error:", error)
    throw error
  }
})

const updateTaskRoute = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateTaskSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Task updated successfully",
      content: {
        "application/json": {
          schema: taskSchema,
        },
      },
    },
  },
})

// Use regular route for update to handle 404 errors
app.put("/:id", async (c) => {
  const currentUser = c.get("currentUser")
  const id = c.req.param("id")
  const updates = await c.req.json()

  try {
    const updatedTask = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, currentUser.id)))
      .returning()

    if (updatedTask.length === 0) {
      return c.json({ error: "Task not found" }, 404)
    }

    // Convert Date objects to ISO strings
    const taskResponse = {
      ...updatedTask[0],
      createdAt: updatedTask[0].createdAt.toISOString(),
      updatedAt: updatedTask[0].updatedAt.toISOString(),
    }

    return c.json(taskResponse)
  } catch (error) {
    console.error("Update task error:", error)
    return c.json({ error: "Failed to update task" }, 500)
  }
})

const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Task deleted successfully",
      content: {
        "application/json": {
          schema: deleteResponseSchema,
        },
      },
    },
  },
})

// Use regular route for delete to handle 404 errors
app.delete("/:id", async (c) => {
  const currentUser = c.get("currentUser")
  const id = c.req.param("id")

  try {
    const deletedTask = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, currentUser.id)))
      .returning()

    if (deletedTask.length === 0) {
      return c.json({ error: "Task not found" }, 404)
    }

    return c.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return c.json({ error: "Failed to delete task" }, 500)
  }
})

export { app as taskRoutes }
