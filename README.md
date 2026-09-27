# Medora

Connected prescription refill workflow for patient, pharmacy and provider roles.

## Supabase setup

Set these in Vercel/local environment variables:

- `NEXT_PUBLIC_SUPABASE_URL=https://dmuzjonqpyveyxxdsqsa.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>`
- `SUPABASE_SERVICE_ROLE_KEY=<server-only Supabase service-role key>`
- `LLM_API_URL=` and `LLM_API_KEY=` when the prescription extraction model is connected.

**Never expose `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.**

## Demo

Open `/demo` and click **Seed / reset demo in Supabase** once. Then use:

- `patient` / `MedoraDemo123!`
- `pharmacy` / `MedoraDemo123!`
- `provider` / `MedoraDemo123!`

The three accounts share the same refill. The pharmacy can send a review; the provider can approve, request a visit, request a test, or return it; each action writes an audit event and the other dashboards receive the update through Supabase Realtime.

## New accounts

Signup accepts username/password and an optional connection code. `MEDORA-DEMO` joins the seeded workflow. Accounts created through the server signup path are real Supabase Auth users and their role/profile is stored in `public.profiles`.

## Demo walkthrough

The connected Medora Supabase project contains three demo accounts linked to the same refill workflow. The login page keeps these credentials tucked under **For the demo walkthrough** so they do not dominate the normal login experience.

- Patient: `demo_patient`
- Pharmacy: `demo_pharmacy`
- Provider: `demo_provider`
- Password: `demo@123`

The workflow starts with a refill blocked on **provider approval**. Use the pharmacy view to send the request to the provider, the provider view to approve it, and the pharmacy view to confirm fulfillment. The patient view reflects the shared audit trail throughout.

## Local Gemini setup

The pharmacy prescription parser uses the Gemini API from a server-side Next.js route. Google recommends setting `GEMINI_API_KEY` as an environment variable, and the native `generateContent` API accepts the key through the `x-goog-api-key` header.

1. Open `.env.local`.
2. Set `GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY`.
3. Stop the Next.js dev server completely.
4. Start it again with `npm run dev`.
5. Open the Pharmacy workspace and upload a PDF, JPG, or PNG prescription.

Do not use `NEXT_PUBLIC_GEMINI_API_KEY`: that would expose the secret to the browser. Do not commit `.env.local`.

If Gemini returns an authentication error, check that the key is an active Gemini API key in Google AI Studio and that it is restricted/allowed for the Gemini API.
