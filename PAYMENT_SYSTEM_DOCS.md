# Payment Success Handling System - Polar Webhooks

## 📋 Overview

This document describes the complete payment success handling system for the Talksy Code Visualizer SaaS application using Polar webhooks.

---

## 🔄 Data Flow

```
User → Checkout Page → Polar Payment → Payment Successful
  ↓
Polar Webhook → /api/webhook → User Model Updated (isPro = true)
  ↓
User Redirected → /billing-success → Fetch User Status → Show Pro Activation
```

---

## 🧩 Components

### 1. User Model (`lib/models/User.ts`)

**Fields:**
- `email` (String, unique, required, lowercase, indexed)
- `clerkId` (String, optional, indexed)
- `isPro` (Boolean, default: false)
- `createdAt` (Date)
- `updatedAt` (Date)

**Purpose:** Store user information and Pro status

---

### 2. Webhook API Route (`app/api/webhook/route.ts`)

**Endpoint:** `POST /api/webhook`

**Responsibilities:**
1. ✅ Validate Polar webhook signature using `POLAR_WEBHOOK_SECRET`
2. ✅ Check if event type is `order.paid`
3. ✅ Extract customer email from `body.data.customer_email`
4. ✅ Find user by email in MongoDB
5. ✅ Update `isPro` to `true`
6. ✅ Log all events for debugging
7. ✅ Handle errors gracefully

**Security:**
- ✅ Verifies webhook signature using Polar SDK
- ✅ Only POST method allowed
- ✅ Requires `POLAR_WEBHOOK_SECRET` environment variable

**Example Webhook Payload:**
```json
{
  "type": "order.paid",
  "id": "evt_123456789",
  "data": {
    "id": "order_123456789",
    "status": "completed",
    "customer_id": "cus_123456789",
    "customer_email": "user@example.com",
    "metadata": {
      "clerkUserId": "clerk_user_id",
      "email": "user@example.com"
    }
  }
}
```

**Response:**
```json
{
  "received": true,
  "synced": true,
  "email": "user@example.com",
  "userId": "mongo_id",
  "isPro": true
}
```

---

### 3. User Status API (`app/api/user/status/route.ts`)

**Endpoint:** `GET /api/user/status?email=user@example.com`

**Responsibilities:**
1. ✅ Accept email query parameter
2. ✅ Fetch user from MongoDB by email
3. ✅ Return `isPro` status
4. ✅ Handle missing users gracefully

**Response (Pro User):**
```json
{
  "isPro": true,
  "email": "user@example.com",
  "found": true
}
```

**Response (Non-Pro User):**
```json
{
  "isPro": false,
  "email": "user@example.com",
  "found": false
}
```

---

### 4. Checkout API Updates (`app/api/billing/checkout/route.ts`)

**Changes:**
- ✅ Extracts user email from Clerk `sessionClaims`
- ✅ Passes email to `createCheckoutSession`
- ✅ Email is included in Polar checkout metadata

---

### 5. Checkout Provider (`lib/actions/billing/provider.ts`)

**Updates:**
- ✅ Added `email` to `CheckoutPayload` interface
- ✅ Passes email to Polar checkout metadata
- ✅ Email is then sent to webhook

---

### 6. Billing Success Page (`app/(dashboard)/billing-success/page.tsx`)

**Features:**
- ✅ Client-side component with `"use client"`
- ✅ Fetches user email from Clerk
- ✅ Calls `/api/user/status` to get Pro status
- ✅ Shows loading state during verification
- ✅ Shows success message if `isPro = true`
- ✅ Shows error message if status fetch fails
- ✅ Links to visualizer and home page

**States:**
1. **Loading:** "Verifying your payment..."
2. **Success (Pro):** "Pro Activated 🎉"
3. **Success (Non-Pro):** "Your credit pack was added successfully"
4. **Error:** Shows error message with support instructions

---

## 🚀 Implementation Steps

### Step 1: Environment Variables

Add to `.env.local`:

```env
# Polar Webhook
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Polar Checkout
POLAR_ACCESS_TOKEN=pat_xxxxxxxxxxxxx
POLAR_PRODUCT_ID=prod_xxxxxxxxxxxxx
POLAR_API_BASE_URL=https://api.polar.sh

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Clerk (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_xxxxxxxxxxxxx
```

### Step 2: Polar Webhook Configuration

In your Polar Dashboard:

1. Go to **Webhooks** settings
2. Add new webhook endpoint: `https://yourdomain.com/api/webhook`
3. Subscribe to events:
   - ✅ `order.paid`
4. Copy the webhook secret to `POLAR_WEBHOOK_SECRET`

### Step 3: Test the Flow

```bash
# 1. Start the development server
npm run dev

# 2. Navigate to checkout page
# 3. Use Polar test card: 4242 4242 4242 4242
# 4. Complete checkout
# 5. Verify redirect to /billing-success
# 6. Check MongoDB for isPro = true
```

---

## 📊 Database Queries

**Check if user is Pro:**
```javascript
// Using Mongoose
const user = await User.findOne({ email: "user@example.com" });
console.log(user.isPro); // true or false
```

**List all Pro users:**
```javascript
const proUsers = await User.find({ isPro: true });
```

**Update user to Pro manually:**
```javascript
await User.updateOne(
  { email: "user@example.com" },
  { $set: { isPro: true } }
);
```

---

## 🔍 Debugging

### Check Webhook Logs

Look for logs in server console:

```log
[Polar Webhook] Received event: {
  eventType: "order.paid",
  eventId: "evt_123456789",
  customerEmail: "user@example.com",
  timestamp: "2024-04-09T10:30:45Z"
}

[Polar Webhook] User upgraded to Pro: {
  email: "user@example.com",
  userId: "mongo_object_id",
  isPro: true
}
```

### Test Webhook Manually

```bash
# Using curl (replace with your secret and email)
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "webhook-id: evt_test" \
  -H "webhook-timestamp: $(date +%s)" \
  -H "webhook-signature: test_signature" \
  -d '{
    "type": "order.paid",
    "id": "evt_test",
    "data": {
      "customer_email": "test@example.com",
      "status": "completed"
    }
  }'
```

### Common Issues

**Issue:** Webhook returns 403 (Invalid webhook signature)
- **Solution:** Verify `POLAR_WEBHOOK_SECRET` is correct and matches Polar dashboard

**Issue:** User not upgraded after payment
- **Solution:** Check MongoDB connection and `MONGODB_URI`
- Verify webhook endpoint is publicly accessible
- Check server logs for error messages

**Issue:** Success page shows "Could not verify status"
- **Solution:** Verify Clerk is properly configured
- Check `/api/user/status` endpoint is working

---

## 🧪 Integration with Existing System

### UserSubscription Model vs User Model

Your app uses both:

1. **UserSubscription** (existing)
   - Tracks subscription plans, credits, usage
   - Uses Clerk `userId` as identifier
   - Already handle by `/api/billing/webhook`

2. **User** (new)
   - Simple email-based user tracking
   - Stores `isPro` status
   - Used for webhook email lookup

**Data Sync:** When webhook triggers, update both models:
- Email-based lookup via `User` model
- Then optionally update `UserSubscription` based on Clerk ID

---

## 💡 Production Checklist

- [ ] Set all environment variables in production
- [ ] Configure Polar webhook endpoint
- [ ] Test payment flow with test card
- [ ] Monitor webhook logs for errors
- [ ] Set up alerting for failed webhooks
- [ ] Add rate limiting to webhook endpoint
- [ ] Enable MongoDB backups
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Test redirect flow after payment
- [ ] Verify success page loads correctly

---

## 📞 Support

For issues or questions:
1. Check webhook logs in server console
2. Verify all environment variables are set
3. Test Polar webhook connectivity
4. Check MongoDB connectivity
5. Review Polar SDK documentation: https://docs.polar.sh

---

**Last Updated:** April 9, 2026
