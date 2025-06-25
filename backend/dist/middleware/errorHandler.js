"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, c) => {
    console.error("Unhandled error:", err);
    // Check if it's a validation error
    if (err.message.includes("validation")) {
        return c.json({ error: "Invalid request data" }, 400);
    }
    // Check if it's an authentication error
    if (err.message.includes("Unauthorized") || err.message.includes("Invalid token")) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    // Check if it's a not found error
    if (err.message.includes("not found")) {
        return c.json({ error: "Resource not found" }, 404);
    }
    // Check if it's a Google AI API error
    if (err.message.includes("Google AI API key not configured")) {
        return c.json({ error: "AI service not available" }, 503);
    }
    // Default server error
    return c.json({ error: "Internal server error" }, 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map