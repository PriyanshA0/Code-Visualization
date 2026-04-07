import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/visualizer(.*)",
  "/billing-success(.*)",
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
    "/billing-success(.*)",
    "/api/snippets(.*)",
    "/api/execute(.*)",
    "/api/billing/checkout(.*)",
    "/api/usage/quota(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
};