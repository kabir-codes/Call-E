import { z } from "zod";

/**
 * Schema for a registered call that the AI couldn't route to a resource.
 * All fields are JSONable for frontend/backend/database compatibility.
 */
export const CallSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  transcript: z.string(),
  customerIntent: z.string(),
  aiSuggestion: z.string().nullable(),
  status: z.enum(["pending", "resolved", "escalated"]),
  resolution: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Call = z.infer<typeof CallSchema>;

/**
 * Schema for creating a new call registration.
 */
export const CreateCallSchema = CallSchema.omit({
  id: true,
  timestamp: true,
  status: true,
  resolution: true,
}).extend({
  status: z.enum(["pending", "resolved", "escalated"]).default("pending"),
});

export type CreateCall = z.infer<typeof CreateCallSchema>;

/**
 * Schema for updating an existing call.
 */
export const UpdateCallSchema = CallSchema.partial().omit({ id: true, timestamp: true });

export type UpdateCall = z.infer<typeof UpdateCallSchema>;

/**
 * Schema for transcription request.
 */
export const TranscribeRequestSchema = z.object({
  audioBase64: z.string(),
  mimeType: z.string().optional().default("audio/webm"),
});

export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;

/**
 * Schema for transcription response.
 */
export const TranscribeResponseSchema = z.object({
  transcript: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;

/**
 * Schema for AI routing request.
 */
export const RouteCallRequestSchema = z.object({
  transcript: z.string(),
});

export type RouteCallRequest = z.infer<typeof RouteCallRequestSchema>;

/**
 * Schema for AI routing response.
 */
export const RouteCallResponseSchema = z.object({
  canRoute: z.boolean(),
  resource: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  customerIntent: z.string(),
  suggestion: z.string().nullable(),
});

export type RouteCallResponse = z.infer<typeof RouteCallResponseSchema>;

/**
 * Schema for API error response.
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
