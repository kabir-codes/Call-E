"use client";

import { useState, useCallback, useEffect } from "react";
import VoiceRecorder from "./VoiceRecorder";
import CallList from "./CallList";
import {
  Call,
  TranscribeResponse,
  RouteCallResponse,
} from "@/lib/schemas";

export default function CallPortal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [lastResult, setLastResult] = useState<{
    transcript: string;
    routing: RouteCallResponse | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch calls on mount
  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const response = await fetch("/api/calls");
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      }
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    }
  };

  const handleRecordingComplete = useCallback(async (audioBase64: string) => {
    setIsProcessing(true);
    setError(null);
    setLastResult(null);

    try {
      // Step 1: Transcribe the audio
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64 }),
      });

      const transcribeData: TranscribeResponse = await transcribeResponse.json();

      if (!transcribeData.success) {
        throw new Error(transcribeData.error || "Failed to transcribe audio");
      }

      // Step 2: Route the call using AI
      const routeResponse = await fetch("/api/route-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcribeData.transcript }),
      });

      if (!routeResponse.ok) {
        throw new Error("Failed to analyze call");
      }

      const routeData: RouteCallResponse = await routeResponse.json();

      setLastResult({
        transcript: transcribeData.transcript,
        routing: routeData,
      });

      // Step 3: If AI cannot route, register the call
      if (!routeData.canRoute) {
        const registerResponse = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: transcribeData.transcript,
            customerIntent: routeData.customerIntent,
            aiSuggestion: routeData.suggestion,
          }),
        });

        if (registerResponse.ok) {
          const newCall: Call = await registerResponse.json();
          setCalls((prev) => [newCall, ...prev]);
        }
      }
    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(
    async (id: string, status: Call["status"], resolution?: string) => {
      try {
        const response = await fetch("/api/calls", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status, resolution }),
        });

        if (response.ok) {
          const updatedCall: Call = await response.json();
          setCalls((prev) =>
            prev.map((call) => (call.id === id ? updatedCall : call))
          );
        }
      } catch (err) {
        console.error("Failed to update call:", err);
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Call-E Portal</h1>
          <p className="text-gray-600 mt-2">
            Voice recognition call routing and registration system
          </p>
        </header>

        {/* Voice Recording Section */}
        <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Record Customer Call
          </h2>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
          />

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {lastResult && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Call Analysis Result
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Transcript:</span>{" "}
                  {lastResult.transcript}
                </p>
                {lastResult.routing && (
                  <>
                    <p>
                      <span className="font-medium">Customer Intent:</span>{" "}
                      {lastResult.routing.customerIntent}
                    </p>
                    <p>
                      <span className="font-medium">Can Route Automatically:</span>{" "}
                      <span
                        className={
                          lastResult.routing.canRoute
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {lastResult.routing.canRoute ? "Yes" : "No"}
                      </span>
                    </p>
                    {lastResult.routing.canRoute && lastResult.routing.resource && (
                      <p>
                        <span className="font-medium">Routed to:</span>{" "}
                        {lastResult.routing.resource}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Confidence:</span>{" "}
                      {(lastResult.routing.confidence * 100).toFixed(0)}%
                    </p>
                    {lastResult.routing.suggestion && (
                      <p>
                        <span className="font-medium">AI Suggestion:</span>{" "}
                        {lastResult.routing.suggestion}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Registered Calls Section */}
        <section className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Registered Calls ({calls.length})
          </h2>
          <CallList calls={calls} onUpdateStatus={handleUpdateStatus} />
        </section>
      </div>
    </div>
  );
}
