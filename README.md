# showoff-marketing

A minimal TanStack Start app with one route and plain CSS.

```bash
npm install
npm run dev
```

Edit `src/routes/index.tsx` to get started. Add route files under
`src/routes`; TanStack Router updates `src/routeTree.gen.ts` for you.

Build the production app with:

```bash
npm run build
```

## Tests

Vitest discovers unit tests named `*.test.ts` or `*.test.tsx` under `src/`.

```bash
npm test
npm run test:watch
```

Playwright is configured for Chromium. Install its browser once, then run end-to-end specs from `e2e/`:

```bash
npx playwright install chromium
npm run test:e2e
```
