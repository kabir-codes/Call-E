"use client";

import { Call } from "@/lib/schemas";

interface CallListProps {
  calls: Call[];
  onUpdateStatus: (id: string, status: Call["status"], resolution?: string) => void;
}

export default function CallList({ calls, onUpdateStatus }: CallListProps) {
  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No calls registered yet.</p>
        <p className="text-sm">Unresolved calls will appear here.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: Call["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <div
          key={call.id}
          className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(
                  call.status
                )}`}
              >
                {call.status.toUpperCase()}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(call.timestamp)}
              </p>
            </div>
            <div className="flex gap-2">
              {call.status === "pending" && (
                <>
                  <button
                    onClick={() => onUpdateStatus(call.id, "resolved", "Resolved by agent")}
                    className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => onUpdateStatus(call.id, "escalated")}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Escalate
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">Customer Intent</h4>
              <p className="text-sm text-gray-600">{call.customerIntent}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700">Transcript</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                &quot;{call.transcript}&quot;
              </p>
            </div>

            {call.aiSuggestion && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700">AI Suggestion</h4>
                <p className="text-sm text-blue-600">{call.aiSuggestion}</p>
              </div>
            )}

            {call.resolution && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Resolution</h4>
                <p className="text-sm text-green-600">{call.resolution}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
