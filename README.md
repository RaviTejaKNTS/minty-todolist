# TasksMint

1. Create a Supabase project.
2. Enable Email, Google and Apple auth providers.
3. Add `<SUPABASE_URL>/auth/v1/callback` as redirect URI in Supabase and OAuth consoles.
4. Run `psql $SUPABASE_DB < supabase/001_init.sql` to create tables and policies.
5. (Optional) Run `psql $SUPABASE_DB < supabase/seed.sql` for demo data.
6. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. `npm install` then `npm run dev`.
8. Open http://localhost:5173 and sign in or continue as guest.
