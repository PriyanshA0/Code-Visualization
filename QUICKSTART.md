# Quick Start (Team Handoff)

## 1) Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 2) Add `.env.local`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/visualizer
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/visualizer

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/talksy-code-visualizer

APP_BASE_URL=http://localhost:3000
POLAR_ACCESS_TOKEN=polar_access_token_here
POLAR_PRODUCT_ID=polar_product_id_here
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_API_BASE_URL=https://api.polar.sh
```

## 3) Validate Auth + Quota

1. Open `/visualizer` while signed out -> should redirect to sign-in.
2. Sign in -> visualizer should open.
3. First prompt should mention 2 free attempts.
4. Run code 2 times -> success.
5. 3rd run -> upgrade/paywall popup.
6. Complete checkout -> you receive 10 paid credits.
7. Each execution consumes 1 paid credit.

## 4) Validate Billing

- Click upgrade button in popup.
- If Polar env configured, redirect should go to Polar checkout.
- If not configured, API returns setup guidance.

### Local Webhook Test (ngrok)

Polar cannot call `localhost` directly, so expose your app first:

```bash
ngrok http 3000
```

Then set Polar webhook URL to:

```text
https://<your-ngrok-subdomain>.ngrok.io/api/billing/webhook
```

After payment, verify credit grant by checking quota in UI or `GET /api/usage/quota`.

## 5) Important Routes

- `POST /api/execute/javascript`
- `POST /api/execute/python`
- `GET /api/usage/quota`
- `POST /api/billing/checkout`
- `POST /api/billing/webhook`

## 6) If Something Breaks

- Check Clerk keys and sign-in URLs.
- Check MongoDB URI/IP allowlist.
- Check `POLAR_ACCESS_TOKEN` and `POLAR_PRODUCT_ID`.
- Check `POLAR_WEBHOOK_SECRET` and ngrok webhook URL.
- Confirm `proxy.ts` still protects execute and usage routes.

## 7) Push Workflow

```bash
git add .
git commit -m "docs: update handoff guide and billing flow"
git push origin <your-branch>
```

Use the full README for architecture and implementation details.
