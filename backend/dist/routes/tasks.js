"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRoutes = void 0;
const zod_openapi_1 = require("@hono/zod-openapi");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = new zod_openapi_1.OpenAPIHono();
exports.taskRoutes = app;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const taskSchema = zod_openapi_1.z.object({
    id: zod_openapi_1.z.string(),
    title: zod_openapi_1.z.string(),
    description: zod_openapi_1.z.string().nullable(),
    category: zod_openapi_1.z.string(),
    completed: zod_openapi_1.z.boolean(),
    userId: zod_openapi_1.z.string(),
    createdAt: zod_openapi_1.z.string(),
    updatedAt: zod_openapi_1.z.string(),
});
const createTaskSchema = zod_openapi_1.z.object({
    title: zod_openapi_1.z.string().min(1).max(500),
    description: zod_openapi_1.z.string().optional(),
    category: zod_openapi_1.z.string().default("personal"),
});
const updateTaskSchema = zod_openapi_1.z.object({
    title: zod_openapi_1.z.string().min(1).max(500).optional(),
    description: zod_openapi_1.z.string().optional(),
    category: zod_openapi_1.z.string().optional(),
    completed: zod_openapi_1.z.boolean().optional(),
});
const bulkCreateRequestSchema = zod_openapi_1.z.object({
    tasks: zod_openapi_1.z.array(createTaskSchema),
});
const bulkCreateResponseSchema = zod_openapi_1.z.object({
    message: zod_openapi_1.z.string(),
    count: zod_openapi_1.z.number(),
});
const deleteResponseSchema = zod_openapi_1.z.object({
    message: zod_openapi_1.z.string(),
});
// Middleware to verify JWT token and get user
const requireAuth = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId)).limit(1);
        if (user.length === 0) {
            return c.json({ error: "User not found" }, 404);
        }
        c.set("currentUser", user[0]);
        await next();
    }
    catch (error) {
        return c.json({ error: "Invalid token" }, 401);
    }
};
app.use("*", requireAuth);
const getTasksRoute = (0, zod_openapi_1.createRoute)({
    method: "get",
    path: "/",
    responses: {
        200: {
            description: "List of tasks",
            content: {
                "application/json": {
                    schema: zod_openapi_1.z.array(taskSchema),
                },
            },
        },
    },
});
app.openapi(getTasksRoute, async (c) => {
    const currentUser = c.get("currentUser");
    try {
        const userTasks = await db_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.userId, currentUser.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
        // Convert Date objects to ISO strings
        const tasksResponse = userTasks.map((task) => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
        }));
        return c.json(tasksResponse);
    }
    catch (error) {
        console.error("Get tasks error:", error);
        throw error;
    }
});
const createTaskRoute = (0, zod_openapi_1.createRoute)({
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
});
app.openapi(createTaskRoute, async (c) => {
    const currentUser = c.get("currentUser");
    const taskData = await c.req.json();
    try {
        const newTask = await db_1.db
            .insert(schema_1.tasks)
            .values({
            ...taskData,
            userId: currentUser.id,
        })
            .returning();
        // Convert Date objects to ISO strings
        const taskResponse = {
            ...newTask[0],
            createdAt: newTask[0].createdAt.toISOString(),
            updatedAt: newTask[0].updatedAt.toISOString(),
        };
        return c.json(taskResponse, 201);
    }
    catch (error) {
        console.error("Create task error:", error);
        throw error;
    }
});
const bulkCreateTasksRoute = (0, zod_openapi_1.createRoute)({
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
});
app.openapi(bulkCreateTasksRoute, async (c) => {
    const currentUser = c.get("currentUser");
    const { tasks: taskList } = await c.req.json();
    try {
        const tasksToInsert = taskList.map((task) => ({
            ...task,
            userId: currentUser.id,
        }));
        await db_1.db.insert(schema_1.tasks).values(tasksToInsert);
        return c.json({
            message: "Tasks created successfully",
            count: tasksToInsert.length,
        }, 201);
    }
    catch (error) {
        console.error("Bulk create tasks error:", error);
        throw error;
    }
});
const updateTaskRoute = (0, zod_openapi_1.createRoute)({
    method: "put",
    path: "/{id}",
    request: {
        params: zod_openapi_1.z.object({
            id: zod_openapi_1.z.string(),
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
});
// Use regular route for update to handle 404 errors
app.put("/:id", async (c) => {
    const currentUser = c.get("currentUser");
    const id = c.req.param("id");
    const updates = await c.req.json();
    try {
        const updatedTask = await db_1.db
            .update(schema_1.tasks)
            .set({ ...updates, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, currentUser.id)))
            .returning();
        if (updatedTask.length === 0) {
            return c.json({ error: "Task not found" }, 404);
        }
        // Convert Date objects to ISO strings
        const taskResponse = {
            ...updatedTask[0],
            createdAt: updatedTask[0].createdAt.toISOString(),
            updatedAt: updatedTask[0].updatedAt.toISOString(),
        };
        return c.json(taskResponse);
    }
    catch (error) {
        console.error("Update task error:", error);
        return c.json({ error: "Failed to update task" }, 500);
    }
});
const deleteTaskRoute = (0, zod_openapi_1.createRoute)({
    method: "delete",
    path: "/{id}",
    request: {
        params: zod_openapi_1.z.object({
            id: zod_openapi_1.z.string(),
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
});
// Use regular route for delete to handle 404 errors
app.delete("/:id", async (c) => {
    const currentUser = c.get("currentUser");
    const id = c.req.param("id");
    try {
        const deletedTask = await db_1.db
            .delete(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, currentUser.id)))
            .returning();
        if (deletedTask.length === 0) {
            return c.json({ error: "Task not found" }, 404);
        }
        return c.json({ message: "Task deleted successfully" });
    }
    catch (error) {
        console.error("Delete task error:", error);
        return c.json({ error: "Failed to delete task" }, 500);
    }
});
//# sourceMappingURL=tasks.js.map