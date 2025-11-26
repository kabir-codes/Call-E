import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { RouteCallRequestSchema, RouteCallResponseSchema, ApiErrorSchema } from "@/lib/schemas";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

// Schema for structured AI response
const AIRoutingResultSchema = z.object({
  canRoute: z.boolean(),
  resource: z.string().nullable(),
  confidence: z.number(),
  customerIntent: z.string(),
  suggestion: z.string().nullable(),
});

/**
 * POST /api/route-call
 * Uses OpenAI to analyze the transcript and determine if it can be routed
 * to a resource or needs human intervention.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = RouteCallRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const error = ApiErrorSchema.parse({
        error: "Invalid request body",
        details: parseResult.error.message,
      });
      return NextResponse.json(error, { status: 400 });
    }

    const { transcript } = parseResult.data;

    // Use OpenAI to analyze the transcript
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a customer service routing AI. Analyze the customer's request and determine:
1. If the request can be automatically routed to an existing resource (FAQ, knowledge base, automated system)
2. The customer's primary intent
3. A confidence score (0-1) for your routing decision
4. A suggestion for resolution if you cannot route automatically

Common resources you can route to:
- "faq:billing" - Billing and payment questions
- "faq:account" - Account management
- "faq:technical" - Technical support documentation
- "faq:returns" - Returns and refunds policy
- "automated:password-reset" - Password reset flow
- "automated:order-status" - Order tracking system

If the request is complex, ambiguous, or requires human judgment, set canRoute to false.

Respond ONLY with valid JSON in this format:
{
  "canRoute": boolean,
  "resource": string or null,
  "confidence": number between 0 and 1,
  "customerIntent": string describing what the customer wants,
  "suggestion": string with suggestion for human agent, or null if canRoute is true
}`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    const parsedAIResponse = JSON.parse(aiResponse);
    const validatedResponse = AIRoutingResultSchema.parse(parsedAIResponse);

    // Ensure confidence is within bounds
    const response = RouteCallResponseSchema.parse({
      ...validatedResponse,
      confidence: Math.max(0, Math.min(1, validatedResponse.confidence)),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Routing error:", error);

    const errorResponse = ApiErrorSchema.parse({
      error: "Failed to analyze call",
      details: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
