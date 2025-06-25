"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const zod_openapi_1 = require("@hono/zod-openapi");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = new zod_openapi_1.OpenAPIHono();
exports.authRoutes = app;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const userSchema = zod_openapi_1.z.object({
    id: zod_openapi_1.z.string(),
    clerkId: zod_openapi_1.z.string(),
    email: zod_openapi_1.z.string().email(),
    name: zod_openapi_1.z.string(),
    createdAt: zod_openapi_1.z.string(),
    updatedAt: zod_openapi_1.z.string(),
});
const syncUserRequestSchema = zod_openapi_1.z.object({
    clerkId: zod_openapi_1.z.string(),
    email: zod_openapi_1.z.string().email(),
    name: zod_openapi_1.z.string(),
});
const syncUserResponseSchema = zod_openapi_1.z.object({
    user: userSchema,
    token: zod_openapi_1.z.string(),
});
const errorResponseSchema = zod_openapi_1.z.object({
    error: zod_openapi_1.z.string(),
});
// Middleware to verify JWT token
const verifyToken = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        c.set("user", decoded);
        await next();
    }
    catch (error) {
        return c.json({ error: "Invalid token" }, 401);
    }
};
const syncUserRoute = (0, zod_openapi_1.createRoute)({
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
});
app.openapi(syncUserRoute, async (c) => {
    try {
        const { clerkId, email, name } = await c.req.json();
        // Check if user already exists
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId)).limit(1);
        let user;
        if (existingUser.length > 0) {
            user = existingUser[0];
        }
        else {
            // Create new user
            const newUsers = await db_1.db
                .insert(schema_1.users)
                .values({
                clerkId,
                email,
                name,
            })
                .returning();
            user = newUsers[0];
        }
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, clerkId: user.clerkId, email: user.email }, JWT_SECRET, {
            expiresIn: "7d",
        });
        // Convert Date objects to ISO strings
        const userResponse = {
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
        return c.json({ user: userResponse, token });
    }
    catch (error) {
        console.error("Auth sync error:", error);
        // For OpenAPI compliance, we need to handle errors differently
        // This will be a 500 error but we can't define it in the OpenAPI schema
        // In a real app, you might want to use a separate error handling middleware
        throw error;
    }
});
const getMeRoute = (0, zod_openapi_1.createRoute)({
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
});
// Use regular route for /me to handle errors properly
app.use("/me", verifyToken);
app.get("/me", async (c) => {
    try {
        const userInfo = c.get("user");
        const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userInfo.userId)).limit(1);
        if (user.length === 0) {
            return c.json({ error: "User not found" }, 404);
        }
        // Convert Date objects to ISO strings
        const userResponse = {
            ...user[0],
            createdAt: user[0].createdAt.toISOString(),
            updatedAt: user[0].updatedAt.toISOString(),
        };
        return c.json(userResponse);
    }
    catch (error) {
        console.error("Get user error:", error);
        return c.json({ error: "Failed to get user" }, 500);
    }
});
//# sourceMappingURL=auth.js.map