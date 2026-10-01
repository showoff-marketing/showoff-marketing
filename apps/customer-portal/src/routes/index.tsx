import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto mt-16 w-full max-w-2xl px-4">
      <h1 className="text-3xl font-bold tracking-tight">Welcome to TanStack Start</h1>
      <p className="mt-4 text-slate-600">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
    </main>
  )
}
