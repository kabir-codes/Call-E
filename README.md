# Call-E

A voice recognition call portal that accepts calls based on voice recognition and registers information on the portal if the AI is unable to direct the customer to a resource.

## Features

- **Voice Recording**: Browser-based voice recording using the Web Audio API
- **Speech-to-Text**: Transcribes audio using OpenAI's Whisper model
- **AI Call Routing**: Uses GPT-4 to analyze customer intent and route calls to appropriate resources
- **Call Registration**: Registers unroutable calls for human agent review
- **Call Management**: View, resolve, or escalate registered calls

## Tech Stack

- **Frontend/Backend**: Next.js (Vercel) with TypeScript
- **AI/NLP**: OpenAI (Whisper for transcription, GPT-4 for routing)
- **Validation**: Zod schemas for type-safe, JSONable data structures
- **Styling**: Tailwind CSS

## Architecture

This is a tight frontend/backend monolith built on Vercel/Next.js:

- All data uses JSONable structures for seamless movement between frontend, backend, and database
- Classes are used only for short-lived objects that are never serialized or transmitted
- API routes handle transcription, routing, and call management
- In-memory storage (easily replaceable with a database)

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kabir-codes/Call-E.git
cd Call-E
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### POST /api/transcribe
Transcribes audio to text using OpenAI Whisper.

**Request:**
```json
{
  "audioBase64": "base64_encoded_audio",
  "mimeType": "audio/webm"
}
```

### POST /api/route-call
Analyzes a transcript and determines if it can be routed to a resource.

**Request:**
```json
{
  "transcript": "Customer's spoken text"
}
```

### GET /api/calls
Returns all registered calls.

### POST /api/calls
Registers a new call that couldn't be automatically routed.

**Request:**
```json
{
  "transcript": "Customer's spoken text",
  "customerIntent": "What the customer wants",
  "aiSuggestion": "AI's suggestion for resolution"
}
```

### PATCH /api/calls
Updates an existing call status.

**Request:**
```json
{
  "id": "call_id",
  "status": "resolved",
  "resolution": "How the call was resolved"
}
```

### DELETE /api/calls?id=call_id
Deletes a call by ID.

## Data Models

All data structures are defined using Zod schemas in `/src/lib/schemas.ts` and are fully JSONable:

- `Call`: Registered call with transcript, intent, status, and resolution
- `TranscribeRequest/Response`: Audio transcription payloads
- `RouteCallRequest/Response`: AI routing analysis payloads

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

Make sure to set the `OPENAI_API_KEY` environment variable in your Vercel project settings.

## License

MIT
