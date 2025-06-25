"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const zod_openapi_1 = require("@hono/zod-openapi");
const ai_1 = require("ai");
const google_1 = require("@ai-sdk/google");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = new zod_openapi_1.OpenAPIHono();
exports.aiRoutes = app;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const generateTasksRequestSchema = zod_openapi_1.z.object({
    topic: zod_openapi_1.z.string().min(1).max(200),
});
const generateTasksResponseSchema = zod_openapi_1.z.object({
    tasks: zod_openapi_1.z.array(zod_openapi_1.z.string()),
    topic: zod_openapi_1.z.string(),
});
// Middleware to verify JWT token
const requireAuth = async (c, next) => {
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
const generateTasksRoute = (0, zod_openapi_1.createRoute)({
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
});
app.use("*", requireAuth);
app.openapi(generateTasksRoute, async (c) => {
    const { topic } = await c.req.json();
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        // For OpenAPI compliance, we throw an error instead of returning error response
        throw new Error("Google AI API key not configured");
    }
    try {
        const { text } = await (0, ai_1.generateText)({
            model: (0, google_1.google)("gemini-1.5-flash"),
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
        });
        // Parse the generated text into individual tasks
        const tasks = text
            .split("\n")
            .map((task) => task.trim())
            .filter((task) => task.length > 0)
            .slice(0, 5); // Ensure we only get 5 tasks
        return c.json({ tasks, topic });
    }
    catch (error) {
        console.error("Task generation error:", error);
        throw error;
    }
});
//# sourceMappingURL=ai.js.map