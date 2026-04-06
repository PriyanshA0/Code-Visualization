import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/visualizer(.*)",
  "/api/snippets(.*)",
  "/api/execute(.*)",
  "/api/billing/checkout(.*)",
  "/api/usage/quota(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/visualizer(.*)",
    "/api/snippets(.*)",
    "/api/execute(.*)",
    "/api/billing/checkout(.*)",
    "/api/usage/quota(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
};