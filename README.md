# Satyavadi AI

AI-powered fake news detection and verification platform.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Deployment (Vercel)

1. Import the repository into Vercel (framework preset: **Vite**).
2. Set environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. Add a `vercel.json` rewrite (already included) so client-side routes resolve correctly.