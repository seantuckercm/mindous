import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { tasksTable } from "@/db/schema/tasks";

/**
 * POST /api/tasks
 * Creates a new task for the authenticated user
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User must be authenticated" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { title, description } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Task title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate optional description field
    if (description !== null && description !== undefined && typeof description !== "string") {
      return NextResponse.json(
        { error: "Task description must be a string" },
        { status: 400 }
      );
    }

    // Create task in database using Drizzle ORM
    const [newTask] = await db
      .insert(tasksTable)
      .values({
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        status: "pending",
      })
      .returning();

    // Return success response with created task
    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully",
        task: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: "Internal server error - Failed to create task",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
