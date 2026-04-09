# Payment Success System - Quick Setup Guide

## ✅ What Was Implemented

### Files Created / Modified

1. **New: `lib/models/User.ts`**
   - User model with email and isPro fields
   - MongoDB schema with proper indexing

2. **New: `app/api/webhook/route.ts`**
   - Polar webhook handler for email-based user updates
   - Validates webhook signature
   - Updates user `isPro` status on successful payment

3. **New: `app/api/user/status/route.ts`**
   - API endpoint to check user Pro status
   - Query by email parameter

4. **Updated: `app/(dashboard)/billing-success/page.tsx`**
   - Client component that verifies payment success
   - Fetches user status from `/api/user/status`
   - Shows "Pro Activated 🎉" message for Pro users

5. **Updated: `lib/actions/billing/provider.ts`**
   - Added email parameter to checkout
   - Passes email to Polar metadata

6. **Updated: `app/api/billing/checkout/route.ts`**
   - Extracts email from Clerk `sessionClaims`
   - Passes email to checkout provider

---

## 🚀 Getting Started

### 1. Update `.env.local`

Make sure you have these environment variables:

```env
# Existing (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_xxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Polar Setup (add if not present)
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=pat_xxxxxxxxxxxxx
POLAR_PRODUCT_ID=prod_xxxxxxxxxxxxx
POLAR_API_BASE_URL=https://api.polar.sh
```

### 2. Configure Polar Webhook

1. Log into **Polar Dashboard**
2. Navigate to **Webhooks** or **Settings → Webhooks**
3. Add a new webhook endpoint:
   - **URL:** `https://yourdomain.com/api/webhook`
   - **Events:** Subscribe to `order.paid`
4. Copy the webhook secret → add to `POLAR_WEBHOOK_SECRET`

### 3. Test Locally

```bash
# Start dev server
npm run dev

# Use browser to navigate to checkout
# Enter test card: 4242 4242 4242 4242
# Complete checkout

# After payment → redirected to /billing-success
# Should see: "Pro Activated 🎉"
```

### 4. Verify in MongoDB

```bash
# Check if user was created/updated
# In MongoDB Atlas or local shell:
db.users.findOne({ email: "your-email@example.com" })

# Output should show:
# {
#   email: "your-email@example.com",
#   isPro: true,
#   createdAt: Date,
#   updatedAt: Date
# }
```

---

## 📊 Data Flow Summary

```
User Logs In (Clerk)
    ↓
Click "Upgrade to Pro"
    ↓
/api/billing/checkout (with email from Clerk)
    ↓
Polar Checkout with email in metadata
    ↓
User Completes Payment
    ↓
Polar Sends Webhook to /api/webhook
    ↓
Webhook extracts email → finds User in MongoDB
    ↓
Updates isPro = true
    ↓
User redirected to /billing-success
    ↓
Page fetches /api/user/status?email=...
    ↓
Shows "Pro Activated 🎉"
```

---

## 🔑 Environment Variables Explained

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `POLAR_WEBHOOK_SECRET` | Sign webhook requests | Polar Dashboard → Webhooks |
| `POLAR_ACCESS_TOKEN` | Create checkout sessions | Polar Dashboard → API Keys |
| `POLAR_PRODUCT_ID` | Product to sell | Polar Dashboard → Products |
| `POLAR_API_BASE_URL` | API endpoint | Always `https://api.polar.sh` |
| `MONGODB_URI` | Database connection | MongoDB Atlas or local setup |

---

## 🧪 Test Cases

### ✅ Scenario 1: Successful Payment

1. User logs in via Clerk
2. Clicks "Upgrade to Pro"
3. Completes Polar payment (test card: 4242 4242 4242 4242)
4. Redirected to `/billing-success`
5. **Expected:** See "Pro Activated 🎉"
6. **Verify:** Check MongoDB → user has `isPro: true`

### ✅ Scenario 2: Check Pro Status API

```bash
curl "http://localhost:3000/api/user/status?email=user@example.com"
```

**Response:**
```json
{
  "isPro": true,
  "email": "user@example.com",
  "found": true
}
```

### ✅ Scenario 3: Pro Status in App

After upgrade:
- User should see Pro features enabled
- Visualizer should show unlimited access
- No execution limit messages

---

## 🐛 Debugging Tips

### Check Webhook Logs

```bash
# Terminal where you ran: npm run dev

# Look for logs like:
# [Polar Webhook] Received event: { ... }
# [Polar Webhook] User upgraded to Pro: { ... }
```

### Check MongoDB Records

```bash
# MongoDB Atlas
# Collection: users
# Filter: { email: "user@example.com" }

# Should show isPro: true after payment
```

### Test Webhook Endpoint

```bash
# Check if endpoint is accessible
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json"

# Should return: 400 (missing signature) or 403 (invalid signature)
# NOT 404 (not found)
```

---

## 📋 Checklist for Production

- [ ] All environment variables set
- [ ] Polar webhook configured
- [ ] MongoDB indexes created
- [ ] Clerk properly configured
- [ ] Test payment flow works end-to-end
- [ ] Success page displays correctly
- [ ] Logs being monitored
- [ ] Error tracking enabled (optional: Sentry)
- [ ] Database backups configured
- [ ] Rate limiting on webhook (optional)

---

## ❓ Common Questions

**Q: What if the webhook fails?**
A: Check logs, verify `POLAR_WEBHOOK_SECRET`, ensure MongoDB is connected, check firewall/DNS.

**Q: Can I use email-based and Clerk ID-based upgrades?**
A: Yes! Both systems can work together. Email via webhook, Clerk ID via existing system.

**Q: Why both `User` and `UserSubscription` models?**
A: `User` for email-based webhook lookup, `UserSubscription` for Clerk ID-based tracking.

**Q: How do I test without real payment?**
A: Use Polar test card (4242 4242 4242 4242) on localhost or staging.

**Q: Can I manually upgrade a user?**
A: Yes, update the database: `db.users.updateOne({ email: "..." }, { $set: { isPro: true } })`

---

## 📚 Documentation

- Full details: See `PAYMENT_SYSTEM_DOCS.md`
- Polar SDK: https://docs.polar.sh
- MongoDB: https://docs.mongodb.com
- Clerk: https://clerk.com/docs

---

**Ready to go!** Start with Step 1 (environment variables) and follow through Step 4 (verify in MongoDB).
