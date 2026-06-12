// Vercel serverless function: POST /api/transcribe
// Accepts a multipart/form-data upload with a single `file` field (a short
// voice-journal recording) and forwards it to Groq's Whisper endpoint. Returns
// { text }. The audio is never stored — it is streamed straight through to
// Groq and discarded once the response is returned.

import { guard } from './_auth';

export const config = { runtime: 'edge' };

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
// whisper-large-v3-turbo is fast and cheap; override via env if your account
// uses a different transcription model.
const MODEL = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';

// Reject anything larger than ~20 MB. A few minutes of compressed speech is
// well under this; the cap just stops abuse and runaway uploads.
const MAX_BYTES = 20 * 1024 * 1024;

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
  } as Record<string, string>;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Auth (monitor mode unless ENFORCE_AUTH=true) + soft per-identity rate limit.
  const { rejection } = await guard(req, corsHeaders());
  if (rejection) return rejection;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'Transcription is unavailable right now.' }, 503);
  }

  // This runs on the Vercel edge runtime, where FormData is the DOM/WHATWG
  // type. The shared tsconfig pulls in React Native's FormData type instead
  // (no .get, different append), so we cast to the runtime shape we rely on.
  type WebForm = { get(name: string): Blob | string | null };
  type WebFormData = { append(name: string, value: Blob | string, filename?: string): void };

  let form: WebForm;
  try {
    form = (await req.formData()) as unknown as WebForm;
  } catch {
    return json({ error: 'Expected multipart/form-data' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return json({ error: 'file field is required' }, 400);
  }
  if (file.size === 0) {
    return json({ error: 'Recording was empty' }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: 'Recording is too long' }, 413);
  }

  const upstreamForm = new FormData() as unknown as WebFormData;
  // Groq infers the audio format from the filename extension, so keep one.
  const name = (file as { name?: string }).name || 'recording.m4a';
  upstreamForm.append('file', file, name);
  upstreamForm.append('model', MODEL);
  upstreamForm.append('response_format', 'json');
  upstreamForm.append('temperature', '0');

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: upstreamForm as unknown as FormData,
    });

    if (!upstream.ok) {
      // Log provider detail server-side only; don't leak status/error to client.
      const text = await upstream.text().catch(() => '');
      console.error('groq transcribe upstream error', upstream.status, text.slice(0, 400));
      return json({ error: "Couldn't transcribe that just now." }, 502);
    }

    const data = (await upstream.json()) as { text?: string };
    return json({ text: (data.text ?? '').trim() });
  } catch (err) {
    console.error('groq transcribe handler error', (err as Error).message);
    return json({ error: 'Transcription failed' }, 500);
  }
}
