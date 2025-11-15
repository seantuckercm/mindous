import { auth, currentUser } from "@clerk/nextjs/server";
import { createProfile, getProfileByUserId } from "@/db/queries/profiles-queries";
import { getPendingProfileByEmail } from "@/db/queries/pending-profiles-queries";
import { NextResponse } from "next/server";

/**
 * Manual Profile Creation Endpoint
 * 
 * This endpoint allows authenticated users to manually create their profile
 * if it doesn't exist. This is useful for:
 * 1. Fixing sync issues for users who signed up before webhooks were configured
 * 2. Recovering from webhook failures
 * 3. Manual profile creation during development/testing
 * 
 * Usage:
 * POST /api/user/create-profile
 * (Must be authenticated with Clerk)
 */
export async function POST(req: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "No email address found" },
        { status: 400 }
      );
    }

    console.log(`Manual profile creation requested for user: ${userId} (${email})`);

    // Check if profile already exists
    const existingProfile = await getProfileByUserId(userId);
    
    if (existingProfile) {
      console.log(`Profile already exists for user ${userId}`);
      return NextResponse.json({
        success: true,
        message: "Profile already exists",
        profile: {
          userId: existingProfile.userId,
          email: existingProfile.email,
          membership: existingProfile.membership,
          usageCredits: existingProfile.usageCredits,
        },
      });
    }

    // Check if there's a pending profile from frictionless payment
    const pendingProfile = await getPendingProfileByEmail(email);
    
    if (pendingProfile && !pendingProfile.claimed) {
      console.log(`Found pending profile for ${email}, should be claimed through signup flow`);
      return NextResponse.json({
        success: false,
        error: "Pending profile found. Please complete the signup process to claim it.",
      }, { status: 400 });
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
    
    console.log(`Successfully created profile for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Profile created successfully",
      profile: {
        userId: newProfile.userId,
        email: newProfile.email,
        membership: newProfile.membership,
        usageCredits: newProfile.usageCredits,
      },
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to create profile" 
      },
      { status: 500 }
    );
  }
}

/**
 * Get current user's profile status
 * Useful for checking if profile exists before attempting creation
 */
export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await getProfileByUserId(userId);

    return NextResponse.json({
      exists: !!profile,
      profile: profile ? {
        userId: profile.userId,
        email: profile.email,
        membership: profile.membership,
        usageCredits: profile.usageCredits,
        status: profile.status,
      } : null,
    });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { error: "Failed to check profile" },
      { status: 500 }
    );
  }
}
