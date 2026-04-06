# talksy.code.visualizer

A full-stack code visualization platform with authentication, execution quota control, and Polar billing hooks.

This document is a complete handoff guide for teammates so they can continue development safely.

## What Is Implemented

- Clerk authentication with protected visualizer and protected API routes.
- JavaScript and Python code execution APIs.
- Monthly free usage control: 2 execution attempts per authenticated user.
- Upgrade/paywall behavior when free attempts are exhausted.
- Polar checkout API integration (environment-driven).
- Polar webhook endpoint that syncs subscription state to user plan.
- MongoDB-backed snippets and usage/subscription records.

## Current Product Behavior

### Auth Flow

1. User opens landing page.
2. User clicks Sign In or Sign Up.
3. After successful auth, user is redirected to visualizer.
4. If user is already signed in, Clerk may skip auth UI and redirect directly to visualizer. This is expected behavior.

### Execution + Quota Flow

1. Visualizer reads quota from `GET /api/usage/quota`.
2. First-time session prompt shows: "You have only 2 free attempts".
3. Execution calls:
   - `POST /api/execute/javascript`
   - `POST /api/execute/python`
4. First 2 attempts in month return `200`.
5. Further attempts return `402` with `requiresPayment: true` and upgrade info.

### Upgrade Flow

1. Upgrade button calls `POST /api/billing/checkout`.
2. If Polar is configured, API returns a Polar checkout URL and UI redirects user.
3. If not configured, API returns `503` with clear setup message.

## Environment Variables

Create `.env.local` in project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/visualizer
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/visualizer

# Mongo
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/talksy-code-visualizer
# or
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/talksy-code-visualizer

# App URL for building absolute redirect URLs
APP_BASE_URL=http://localhost:3000
# optional alias
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Polar Billing
POLAR_ACCESS_TOKEN=polar_access_token_here
POLAR_PRODUCT_ID=polar_product_id_here
# optional, defaults to https://api.polar.sh
POLAR_API_BASE_URL=https://api.polar.sh
```

## Polar Integration Details

### Checkout API

- File: `lib/actions/billing/provider.ts`
- Route: `POST /api/billing/checkout`

Behavior:

- Reads `POLAR_ACCESS_TOKEN` and `POLAR_PRODUCT_ID`.
- Calls Polar API `POST /v1/checkouts`.
- Sends product ID and metadata including Clerk user ID.
- Returns checkout URL when successful.
- Returns actionable message when billing is not configured.

### Webhook API

- Route: `POST /api/billing/webhook`
- File: `app/api/billing/webhook/route.ts`

Behavior:

- Parses event payload.
- Reads user mapping from `data.metadata.clerkUserId`.
- Updates `UserSubscription` with paid/free state.
- Sets:
  - `planType` to `pro` for active paid events.
  - `planType` to `free` for cancelled/failed events.

Important:

- Ensure Polar webhook includes metadata `clerkUserId`.
- Point Polar webhook URL to your deployed `/api/billing/webhook` endpoint.

## Data Models Used

- `lib/models/UserSubscription.ts`
  - `userId`
  - `planType` (`free` or `pro`)
  - `monthlyFreeLimit` (default 2)
  - `monthlyFreeUsed`
  - `resetAt`
  - `isPaid`
  - `paymentProvider`, `providerCustomerId`

- `lib/models/CodeSnippet.ts`
- `lib/models/ExecutionLog.ts`

## Key API Routes

- `POST /api/execute/javascript`
- `POST /api/execute/python`
- `GET /api/usage/quota`
- `POST /api/billing/checkout`
- `POST /api/billing/webhook`
- `GET /api/snippets`
- `POST /api/snippets`
- `GET /api/snippets/[id]`
- `DELETE /api/snippets/[id]`

## Route Protection

Protected by Clerk middleware in `proxy.ts`:

- `/visualizer(.*)`
- `/api/snippets(.*)`
- `/api/execute(.*)`
- `/api/usage/quota(.*)`
- `/api/billing/checkout(.*)`

Public routes include auth pages and webhook endpoint.

## Project Structure

```text
app/
  (auth)/
    sign-in/
    sign-up/
  (dashboard)/
    visualizer/
  api/
    execute/
    snippets/
    usage/quota/
    billing/checkout/
    billing/webhook/
components/
  explorer-shell.tsx
  CodeEditor.tsx
  Visualizer.tsx
  snippet-library.tsx
lib/
  actions/
    codeExecution/quota.ts
    billing/provider.ts
  models/
    UserSubscription.ts
    CodeSnippet.ts
    ExecutionLog.ts
  mongodb.ts
proxy.ts
```

## Local Development

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`

## Verification Checklist

1. Open visualizer while signed out -> redirected to sign-in.
2. Sign in -> visualizer opens.
3. First-time prompt appears for free attempts.
4. Run code twice -> success.
5. Third run -> 402 + upgrade popup.
6. Click upgrade:
   - If Polar configured -> redirect to checkout.
   - If not configured -> setup message returned.

## Troubleshooting

### `POST /api/execute/javascript` gives 500

Usually caused by Clerk middleware not matching execution routes.
Check `proxy.ts` includes `/api/execute(.*)`.

### Sign In / Sign Up directly redirects to visualizer

Expected when user is already logged in and single-session mode is enabled in Clerk.
Use the user menu sign-out and retry.

### Upgrade button does not redirect

Check:

- `POLAR_ACCESS_TOKEN`
- `POLAR_PRODUCT_ID`
- `APP_BASE_URL`

And verify access token has permission for checkout creation.

### Webhook not updating plan

Check that Polar webhook payload includes `data.metadata.clerkUserId`.
Without this mapping, server cannot update the correct user.

## Team Handoff Workflow

For next teammate:

1. Pull latest branch.
2. Set `.env.local` from the environment section above.
3. Start app and validate auth + quota + billing.
4. Use this README as source of truth before changing auth/billing logic.

## Build and Run

```bash
npm run build
npm run start
```

## Security Notes

- Never commit `.env.local`.
- Rotate Clerk and Polar keys if exposed.
- Restrict webhook endpoint in production with provider-side signature verification.
