import { NextResponse } from 'next/server';

const MODEL = 'gemini-3.8-flash';
const MAX_BYTES = 10 * 1024 * 1024;

const responseSchema = {
  type: 'object',
  properties: {
    patient_name: { type: 'string' },
    medication: { type: 'string' },
    dosage: { type: 'string' },
    frequency: { type: 'string' },
    refills_remaining: { type: 'integer' },
    requires_provider_review: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: [
    'patient_name',
    'medication',
    'dosage',
    'frequency',
    'refills_remaining',
    'requires_provider_review',
    'notes',
  ],
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured on the server.' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please upload a prescription PDF, JPG, JPEG, or PNG.' }, { status: 400 });
    }

    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    if (!allowed.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, JPG, JPEG, or PNG.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is too large. Please use a file under 10 MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString('base64');
    const isPdf = file.type === 'application/pdf';
    const prompt = `You are extracting structured information from a prescription for a pharmacy workflow. Read the prescription carefully, including visual content. Return only the requested JSON fields. Do not invent values. If a field is unclear or absent, use an empty string for text fields, 0 for refills_remaining when the count cannot be established, and false for requires_provider_review unless the prescription clearly requires provider intervention. Do not make a clinical prescribing decision.

Fields:
- patient_name: patient's full name
- medication: medication name only
- dosage: strength/dose as written
- frequency: directions/frequency as written in concise form
- refills_remaining: number of refills explicitly remaining
- requires_provider_review: true when provider authorization/review is explicitly needed or the refill cannot proceed without it
- notes: short extraction note about ambiguity or missing information; otherwise empty string.`;

    // Gemini's current Interactions API accepts PDF documents and images as
    // native multimodal content and supports structured JSON responses.
    const input = [
      { type: 'text', text: prompt },
      isPdf
        ? { type: 'document', data: base64, mime_type: file.type }
        : { type: 'image', data: base64, mime_type: file.type },
    ];

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        input,
        // Prescription data can contain health information. Do not retain
        // the interaction on Google's side for this one-shot extraction.
        store: false,
        response_format: [{
          type: 'text',
          mime_type: 'application/json',
          schema: responseSchema,
        }],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || 'Gemini could not process the prescription.';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const stepTexts = Array.isArray(payload?.steps)
      ? payload.steps.flatMap((step: { type?: string; content?: Array<{ type?: string; text?: string }> }) =>
          step.type === 'model_output'
            ? (step.content ?? []).filter((item) => item.type === 'text').map((item) => item.text ?? '')
            : []
        )
      : [];
    const text = payload?.output_text || stepTexts.filter(Boolean).join('\n').trim();
    if (!text) {
      return NextResponse.json({ error: 'Gemini returned no prescription text. The model response contained no readable output.' }, { status: 502 });
    }

    let prescription;
    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      prescription = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Gemini returned readable text, but it was not valid JSON.', raw_output: text }, { status: 502 });
    }

    return NextResponse.json({ ok: true, model: MODEL, file: file.name, prescription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Prescription parsing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
