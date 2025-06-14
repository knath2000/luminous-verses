import "server-only";

import { StackServerApp } from "@stackframe/stack";

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  throw new Error(
    "Missing NEXT_PUBLIC_STACK_PROJECT_ID environment variable. " +
    "Please add it to your environment configuration."
  );
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
});
