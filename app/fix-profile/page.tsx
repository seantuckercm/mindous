"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from "lucide-react";

/**
 * Profile Fix Utility Page
 * 
 * This page helps users who are authenticated but don't have a profile
 * in the database. It provides a one-click solution to create their profile.
 * 
 * This is useful for:
 * - Users who signed up before webhooks were configured
 * - Recovery from webhook failures
 * - Development and testing
 */
export default function FixProfilePage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    profile?: any;
  } | null>(null);

  const handleCreateProfile = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/user/create-profile", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          profile: data.profile,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create profile",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckProfile = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/user/create-profile", {
        method: "GET",
      });

      const data = await response.json();

      if (data.exists) {
        setResult({
          success: true,
          message: "Profile exists in database",
          profile: data.profile,
        });
      } else {
        setResult({
          success: false,
          message: "No profile found. Click &apos;Create Profile&apos; to fix this.",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Profile Sync Utility
          </CardTitle>
          <CardDescription>
            Fix missing profile issues for authenticated users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Your Account Information</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">User ID:</span> {userId}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckProfile}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Profile Status"
              )}
            </Button>

            <Button
              onClick={handleCreateProfile}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Profile
                </>
              )}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <Alert
              className={
                result.success
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "Success!" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
              
              {result.profile && (
                <div className="mt-3 p-3 bg-white rounded border border-green-200">
                  <p className="text-sm font-medium mb-2">Profile Details:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.profile, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.success && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {/* Info */}
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-semibold">What does this page do?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Checks if your profile exists in the database</li>
              <li>Creates a profile if one doesn&apos;t exist</li>
              <li>Fixes sync issues between Clerk and Supabase</li>
              <li>Assigns free tier membership (5 credits)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Note: This is a utility page for fixing sync issues. In production,
              profiles should be created automatically via webhooks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
