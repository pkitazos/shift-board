# ShiftBoard

ShiftBoard is a web app that lets a shift manager (admin) view and manage employee availability, and lets employees submit their weekly shift preferences.

---

## Setup Steps

- [x] Create a Supabase project.
- [x] Enable Google OAuth provider in Supabase Auth settings.
- [x] Run database migrations to create `users` and `shifts` tables with RLS policies.
- [x] Seed the admin user email.
- [x] Create a Resend account and verify sender domain/email.
- [ ] Deploy the Supabase Edge Function / Vercel Serverless Function for email sending.
- [x] Scaffold the Vite + React project with TanStack Router.
- [x] Wire up Supabase client, auth, and shift CRUD.
- [x] Build the UI.
- [ ] Deploy to Vercel.
