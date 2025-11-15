import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createProfile, updateProfile, getProfileByUserId } from "@/db/queries/profiles-queries";
import { getPendingProfileByEmail } from "@/db/queries/pending-profiles-queries";
import { NextResponse } from "next/server";

/**
 * Clerk Webhook Handler
 * 
 * This endpoint receives webhooks from Clerk when user events occur.
 * Primary purpose: Automatically sync user data from Clerk to Supabase.
 * 
 * Handles:
 * - user.created: Creates a new profile in Supabase when a user signs up
 * - user.updated: Updates the email in Supabase if changed in Clerk
 * - user.deleted: Handles user deletion (optional)
 * 
 * IMPORTANT: This must be configured in the Clerk Dashboard:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Add endpoint: https://your-domain.com/api/clerk/webhooks
 * 3. Subscribe to events: user.created, user.updated, user.deleted
 * 4. Copy the signing secret to CLERK_WEBHOOK_SECRET env variable
 */

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set in environment variables");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Received Clerk webhook: ${eventType}`);

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt);
        break;
      case "user.updated":
        await handleUserUpdated(evt);
        break;
      case "user.deleted":
        await handleUserDeleted(evt);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Handle user.created event
 * Creates a new profile in Supabase when a user signs up with Clerk
 */
async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== "user.created") return;

  const { id: userId, email_addresses } = evt.data;
  const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);
  const email = primaryEmail?.email_address;

  if (!userId || !email) {
    console.error("Missing userId or email in user.created event");
    return;
  }

  console.log(`Creating profile for new user: ${userId} (${email})`);

  // Check if user already has a profile (shouldn't happen, but safety check)
  const existingProfile = await getProfileByUserId(userId);
  if (existingProfile) {
    console.log(`Profile already exists for user ${userId}, skipping creation`);
    return;
  }

  // Check if there's a pending profile from a frictionless payment
  const pendingProfile = await getPendingProfileByEmail(email);
  
  if (pendingProfile && !pendingProfile.claimed) {
    console.log(`Found pending profile for ${email}, will be claimed through signup flow`);
    // Don't create a profile here - let the claimPendingProfile function handle it
    // This avoids race conditions and duplicate profile creation
    return;
  }

  // Create a basic free profile for the new user
  const profileData = {
    userId,
    email,
    membership: "free" as const,
    paymentProvider: "whop" as const,
    usageCredits: 5, // Free tier credits
    usedCredits: 0,
    status: "active",
  };

  try {
    const newProfile = await createProfile(profileData);
    console.log(`Successfully created profile for user ${userId}:`, {
      userId: newProfile.userId,
      email: newProfile.email,
      membership: newProfile.membership,
      usageCredits: newProfile.usageCredits,
    });
  } catch (error) {
    console.error(`Failed to create profile for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Handle user.updated event
 * Updates the email in Supabase if it was changed in Clerk
 */
async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== "user.updated") return;

  const { id: userId, email_addresses } = evt.data;
  const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);
  const email = primaryEmail?.email_address;

  if (!userId || !email) {
    console.error("Missing userId or email in user.updated event");
    return;
  }

  console.log(`Updating email for user: ${userId} to ${email}`);

  try {
    const profile = await getProfileByUserId(userId);
    
    if (!profile) {
      console.warn(`No profile found for user ${userId}, skipping email update`);
      return;
    }

    if (profile.email !== email) {
      await updateProfile(userId, { email });
      console.log(`Successfully updated email for user ${userId}`);
    } else {
      console.log(`Email unchanged for user ${userId}, skipping update`);
    }
  } catch (error) {
    console.error(`Failed to update email for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 * Handles user deletion (you can implement profile cleanup here if needed)
 */
async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== "user.deleted") return;

  const { id: userId } = evt.data;

  if (!userId) {
    console.error("Missing userId in user.deleted event");
    return;
  }

  console.log(`User deleted event received for: ${userId}`);
  
  // Note: You can implement profile deletion here if needed
  // For now, we just log it. You might want to keep profiles for audit purposes.
  // If you want to delete the profile:
  // await deleteProfile(userId);
  
  console.log(`Skipping profile deletion for audit purposes`);
}
