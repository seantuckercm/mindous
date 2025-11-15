/**
 * Script to manually sync an existing Clerk user to Supabase
 * 
 * This is a one-time script to fix the sync issue for users who signed up
 * before the Clerk webhook was implemented.
 * 
 * Usage:
 * node scripts/sync-existing-user.ts <userId> <email>
 * 
 * Example:
 * node scripts/sync-existing-user.ts user_2xxxxx sean@couplemill.com
 */

import { createProfile, getProfileByUserId } from "@/db/queries/profiles-queries";

async function syncUser(userId: string, email: string) {
  console.log(`Syncing user: ${userId} (${email})`);

  try {
    // Check if profile already exists
    const existingProfile = await getProfileByUserId(userId);
    
    if (existingProfile) {
      console.log("✅ Profile already exists:");
      console.log(JSON.stringify(existingProfile, null, 2));
      return;
    }

    // Create a basic free profile
    const profileData = {
      userId,
      email,
      membership: "free" as const,
      paymentProvider: "whop" as const,
      usageCredits: 5,
      usedCredits: 0,
      status: "active",
    };

    const newProfile = await createProfile(profileData);
    
    console.log("✅ Successfully created profile:");
    console.log(JSON.stringify(newProfile, null, 2));
  } catch (error) {
    console.error("❌ Error syncing user:", error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: node scripts/sync-existing-user.ts <userId> <email>");
  console.error("Example: node scripts/sync-existing-user.ts user_2xxxxx sean@couplemill.com");
  process.exit(1);
}

const [userId, email] = args;

syncUser(userId, email).then(() => {
  console.log("Done!");
  process.exit(0);
});
