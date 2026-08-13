# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to Vercel

This is a TanStack Start (SSR) app, not a static Vite SPA. On Vercel:

1. Point the Vercel project at the repository holding **this** exported code (not the older plain-Vite demo repo).
2. Project Settings → Build & Development Settings:
   - Framework Preset: **Other**
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave empty (the build emits `.vercel/output` via the Build Output API)
3. Redeploy with **Clear build cache** so old output is dropped.

`vercel.json` in the repo already sets the commands, and `vite.config.ts` switches to the Vercel build preset automatically when the `VERCEL` env var is present.

If you see `Loading module from /src/main.tsx was blocked (MIME type text/html)`, Vercel is serving unbuilt source — it means the wrong repo/commit or an Output Directory pointing at the repo root.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

