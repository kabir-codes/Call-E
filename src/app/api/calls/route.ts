import { NextRequest, NextResponse } from "next/server";
import { callStore } from "@/lib/store";
import { CreateCallSchema, UpdateCallSchema, CallSchema, ApiErrorSchema } from "@/lib/schemas";

/**
 * GET /api/calls
 * Get all registered calls.
 */
export async function GET() {
  try {
    const calls = callStore.getAll();
    return NextResponse.json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    const errorResponse = ApiErrorSchema.parse({
      error: "Failed to fetch calls",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/calls
 * Register a new call that the AI couldn't route.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = CreateCallSchema.safeParse(body);

    if (!parseResult.success) {
      const error = ApiErrorSchema.parse({
        error: "Invalid request body",
        details: parseResult.error.message,
      });
      return NextResponse.json(error, { status: 400 });
    }

    const callData = parseResult.data;
    const call = callStore.create({
      transcript: callData.transcript,
      customerIntent: callData.customerIntent,
      aiSuggestion: callData.aiSuggestion,
      status: callData.status ?? "pending",
      resolution: null,
      metadata: callData.metadata,
    });

    // Validate the created call against schema
    const validatedCall = CallSchema.parse(call);
    return NextResponse.json(validatedCall, { status: 201 });
  } catch (error) {
    console.error("Error creating call:", error);
    const errorResponse = ApiErrorSchema.parse({
      error: "Failed to register call",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * PATCH /api/calls
 * Update an existing call (expects id in body).
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id || typeof id !== "string") {
      const error = ApiErrorSchema.parse({
        error: "Missing or invalid call ID",
      });
      return NextResponse.json(error, { status: 400 });
    }

    const parseResult = UpdateCallSchema.safeParse(updateData);
    if (!parseResult.success) {
      const error = ApiErrorSchema.parse({
        error: "Invalid update data",
        details: parseResult.error.message,
      });
      return NextResponse.json(error, { status: 400 });
    }

    const updated = callStore.update(id, parseResult.data);
    if (!updated) {
      const error = ApiErrorSchema.parse({
        error: "Call not found",
      });
      return NextResponse.json(error, { status: 404 });
    }

    const validatedCall = CallSchema.parse(updated);
    return NextResponse.json(validatedCall);
  } catch (error) {
    console.error("Error updating call:", error);
    const errorResponse = ApiErrorSchema.parse({
      error: "Failed to update call",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * DELETE /api/calls
 * Delete a call by ID (expects id in query params).
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      const error = ApiErrorSchema.parse({
        error: "Missing call ID",
      });
      return NextResponse.json(error, { status: 400 });
    }

    const deleted = callStore.delete(id);
    if (!deleted) {
      const error = ApiErrorSchema.parse({
        error: "Call not found",
      });
      return NextResponse.json(error, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting call:", error);
    const errorResponse = ApiErrorSchema.parse({
      error: "Failed to delete call",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
