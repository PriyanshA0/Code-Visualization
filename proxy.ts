import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/visualizer(.*)",
  "/billing-success(.*)",
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
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
};