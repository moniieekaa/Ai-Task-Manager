import type { User } from "../db/schema";
export type Env = {
    Variables: {
        currentUser: User;
        user: {
            userId: string;
            clerkId: string;
            email: string;
        };
    };
};
//# sourceMappingURL=env.d.ts.map