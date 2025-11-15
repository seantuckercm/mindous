# Clerk Webhook Setup Guide

This guide explains how to configure Clerk webhooks to automatically sync users to your Supabase database.

## Problem This Solves

Without webhooks, users who sign up via Clerk are authenticated but have no profile in the Supabase database, causing them to be stuck in a redirect loop between `/dashboard` and `/signup`.

## Implementation

The webhook endpoint is located at `/app/api/clerk/webhooks/route.ts` and handles:
- `user.created` - Creates a new profile when a user signs up
- `user.updated` - Updates email if changed
- `user.deleted` - Logs deletion (profile kept for audit)

## Configuration Steps

### 1. Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.com/api/clerk/webhooks
```

For local development with ngrok:
```
https://your-ngrok-url.ngrok.io/api/clerk/webhooks
```

### 2. Configure in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the left sidebar
4. Click **+ Add Endpoint**
5. Enter your webhook URL
6. Subscribe to these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted` (optional)
7. Click **Create**

### 3. Get the Signing Secret

After creating the webhook:
1. Click on the webhook endpoint you just created
2. Copy the **Signing Secret** (starts with `whsec_...`)
3. Add it to your `.env.local` file:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### 4. Restart Your Application

```bash
npm run dev
```

The webhook is now active and will automatically create profiles for new users!

## Testing the Webhook

### Test with Clerk Dashboard

1. In Clerk Dashboard → Webhooks → Your endpoint
2. Click the **Testing** tab
3. Select `user.created` event
4. Modify the payload if needed
5. Click **Send Test**
6. Check your application logs for success

### Test with Real Signup

1. Sign up a new user via your app
2. Check the Clerk webhook logs in the dashboard
3. Verify the profile was created in Supabase
4. User should be able to access the dashboard

## Syncing Existing Users

For users who signed up before the webhook was configured, use the sync script:

```bash
# Get the user ID from Clerk dashboard
cd /home/ubuntu/mindous
npx tsx scripts/sync-existing-user.ts <userId> <email>

# Example:
npx tsx scripts/sync-existing-user.ts user_2abc123 sean@couplemill.com
```

## Troubleshooting

### Webhook not receiving events

1. Check that the URL is publicly accessible
2. Verify the endpoint returns 200 OK for test events
3. Check Next.js middleware isn't blocking the endpoint
4. Review Clerk dashboard webhook logs for errors

### Signature verification fails

1. Ensure `CLERK_WEBHOOK_SECRET` is correctly set
2. Secret should start with `whsec_`
3. Restart the application after adding the secret
4. Check for extra spaces or quotes in .env.local

### Profile not created

1. Check application logs for error messages
2. Verify database connection and credentials
3. Ensure the `profiles` table exists and migrations are run
4. Check that the user's email is available in the webhook payload

## Security

- ✅ Webhook signature verification using Svix
- ✅ Endpoint excluded from Clerk authentication middleware
- ✅ Only accepts POST requests
- ✅ Validates required headers before processing

## Related Files

- `/app/api/clerk/webhooks/route.ts` - Webhook handler
- `/middleware.ts` - Excludes webhook from auth
- `/scripts/sync-existing-user.ts` - Manual sync script
- `/db/queries/profiles-queries.ts` - Database operations
