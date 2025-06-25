import type { Context } from "hono";
import type { Env } from "../types/env";
export declare const errorHandler: (err: Error, c: Context<Env>) => (Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 503, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">);
//# sourceMappingURL=errorHandler.d.ts.map