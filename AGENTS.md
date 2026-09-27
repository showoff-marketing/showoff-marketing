# AGENTS.md instructions

- When generating markdown that itself contains fenced code blocks, wrap the entire output in four backticks (````) instead of three.
  - Inner code blocks must use triple backticks (```).
  - Never nest triple backticks inside triple backticks.
- ALWAYS use conventional commit messages when commiting changes.
  - Add addition details in the body of the commit using `-` as bullet points.

## Planning and delegation

- Use `gpt-5.6-sol` with `medium` reasoning for planning.
- Scale delegation to the number of concrete, independent workstreams.
- Do not impose an artificial cap on subagents.
- Use as many parallel subagents as reasonably useful and currently supported.
- If concurrency is exhausted, continue remaining workstreams in waves.
- Use `gpt-5.6-luna` with `xhigh` reasoning for every subagent.
- Avoid subagents for trivial or inherently sequential work.
- The main agent owns synthesis, conflict resolution, verification, and final output.

## Shell commands

- Always prefix shell commands with `rtk`.
- Use `rtk proxy <command>` when raw command output is needed.
- Check RTK with `rtk --version`.

Examples:

```bash
rtk git status
rtk npm run build
rtk proxy find . -maxdepth 2 -type f
```

<!-- context7 -->
Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer; your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<what to look up>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs" or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<what to look up>"` — run a separate `docs` command per distinct concept if the question spans multiple topics, unless it's about how they interact
4. Answer using the fetched documentation

Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
Run Context7 CLI requests outside Codex's default sandbox. If a Context7 CLI command fails with DNS or network errors such as ENOTFOUND, host resolution failures, or fetch failed, rerun it outside the sandbox instead of retrying inside the sandbox.
<!-- context7 -->
