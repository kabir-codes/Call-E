import { Call } from "./schemas";

/**
 * In-memory store for calls. In production, this would be replaced
 * with a proper database like PostgreSQL, MongoDB, or a Vercel KV store.
 * 
 * All data is kept in JSONable structures for easy serialization.
 */
class CallStore {
  private calls: Map<string, Call> = new Map();

  /**
   * Generate a unique ID for a call.
   */
  generateId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a new call registration.
   */
  create(data: Omit<Call, "id" | "timestamp">): Call {
    const call: Call = {
      ...data,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };
    this.calls.set(call.id, call);
    return call;
  }

  /**
   * Get a call by ID.
   */
  get(id: string): Call | undefined {
    return this.calls.get(id);
  }

  /**
   * Get all calls as a JSON-serializable array.
   */
  getAll(): Call[] {
    return Array.from(this.calls.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Update a call by ID.
   */
  update(id: string, data: Partial<Omit<Call, "id" | "timestamp">>): Call | undefined {
    const existing = this.calls.get(id);
    if (!existing) return undefined;

    const updated: Call = { ...existing, ...data };
    this.calls.set(id, updated);
    return updated;
  }

  /**
   * Delete a call by ID.
   */
  delete(id: string): boolean {
    return this.calls.delete(id);
  }

  /**
   * Export all data as JSON (for backup/migration).
   */
  toJSON(): Call[] {
    return this.getAll();
  }

  /**
   * Import data from JSON (for restore/migration).
   */
  fromJSON(data: Call[]): void {
    this.calls.clear();
    for (const call of data) {
      this.calls.set(call.id, call);
    }
  }
}

// Singleton instance for the application
export const callStore = new CallStore();
