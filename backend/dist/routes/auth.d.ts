import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/env";
declare const app: OpenAPIHono<Env, {}, "/">;
export { app as authRoutes };
//# sourceMappingURL=auth.d.ts.map