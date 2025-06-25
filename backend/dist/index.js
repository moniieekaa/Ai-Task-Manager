"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const pretty_json_1 = require("hono/pretty-json");
const swagger_ui_1 = require("@hono/swagger-ui");
const zod_openapi_1 = require("@hono/zod-openapi");
const auth_1 = require("./routes/auth");
const tasks_1 = require("./routes/tasks");
const ai_1 = require("./routes/ai");
const errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = new zod_openapi_1.OpenAPIHono();
// Error handling middleware
app.onError(errorHandler_1.errorHandler);
// Middleware
app.use("*", (0, logger_1.logger)());
app.use("*", (0, pretty_json_1.prettyJSON)());
app.use("*", (0, cors_1.cors)({
    origin: ["http://localhost:3000", "https://your-frontend-url.netlify.app"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));
// Health check route
const healthRoute = (0, zod_openapi_1.createRoute)({
    method: "get",
    path: "/health",
    responses: {
        200: {
            description: "Health check response",
            content: {
                "application/json": {
                    schema: zod_openapi_1.z.object({
                        status: zod_openapi_1.z.string(),
                        timestamp: zod_openapi_1.z.string(),
                    }),
                },
            },
        },
    },
});
app.openapi(healthRoute, (c) => {
    return c.json({
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.route("/api/auth", auth_1.authRoutes);
app.route("/api/tasks", tasks_1.taskRoutes);
app.route("/api/ai", ai_1.aiRoutes);
// Swagger UI
app.get("/docs", (0, swagger_ui_1.swaggerUI)({ url: "/doc" }));
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
});
const port = Number(process.env.PORT) || 5000;
console.log(`🚀 Server is running on port ${port}`);
console.log(`📚 API Documentation available at http://localhost:${port}/docs`);
console.log(`🗄️ Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
console.log(`🤖 Google AI: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Configured" : "Not configured"}`);
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
});
//# sourceMappingURL=index.js.map