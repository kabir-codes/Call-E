import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { TranscribeRequestSchema, TranscribeResponseSchema, ApiErrorSchema } from "@/lib/schemas";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

/**
 * POST /api/transcribe
 * Transcribes audio to text using OpenAI's Whisper model.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = TranscribeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const error = ApiErrorSchema.parse({
        error: "Invalid request body",
        details: parseResult.error.message,
      });
      return NextResponse.json(error, { status: 400 });
    }

    const { audioBase64, mimeType } = parseResult.data;

    // Convert base64 to File object for OpenAI API
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    const audioFile = new File([audioBlob], "audio.webm", { type: mimeType });

    // Use OpenAI Whisper for transcription
    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    const response = TranscribeResponseSchema.parse({
      transcript: transcription.text,
      success: true,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Transcription error:", error);

    const errorResponse = TranscribeResponseSchema.parse({
      transcript: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to transcribe audio",
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
