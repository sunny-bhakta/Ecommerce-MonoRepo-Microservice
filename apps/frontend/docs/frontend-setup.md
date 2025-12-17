# Frontend setup and Tailwind class warning notes

## Quick start

```bash
cd apps/frontend
npm install
npm run dev -- --port 4000
```

Ensure `.env.local` contains `GATEWAY_URL` (see `env.example`).

## Tailwind “bg-background class does not exist” warning

If your editor (e.g., VS Code) shows a warning around the `bg-background` utility in `app/globals.css` (lines ~106-108), it is a false positive. That class comes from Tailwind theme tokens defined in `tailwind.config.ts`.

To fix editor validation:

1) Point the Tailwind CSS IntelliSense to the config:

```jsonc
// .vscode/settings.json
{
  "tailwindCSS.experimental.configFile": "apps/frontend/tailwind.config.ts"
}
```

2) Restart the editor or the Tailwind language server.

If you still see the warning during builds, run `npm run lint` inside `apps/frontend` to confirm; the build should pass because the class is generated from the theme.

