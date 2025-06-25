import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/env";
declare const app: OpenAPIHono<Env, {}, "/">;
export { app as taskRoutes };
//# sourceMappingURL=tasks.d.ts.map