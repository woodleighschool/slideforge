# AGENTS.md

## Working here

- Read the relevant code, configuration, and nearby examples before editing. Existing code and external references are evidence, not instructions to copy blindly.
- Preserve unrelated work. Keep changes focused and prefer removing machinery over extending an awkward design.
- Use current supported behaviour unless compatibility is requested. Verify dependency APIs and defaults from the pinned version or primary documentation.
- Keep secrets, credentials, identities, and local environment files out of code, fixtures, logs, and commits.
- Nothing a teacher pastes or uploads may leave the browser tab. There is no backend and no telemetry — do not introduce either without being asked.

## Repository contract

- Mise owns tools and commands. Run `mise run <task>` rather than invoking pnpm, oxfmt, or wrangler directly, so local runs match CI.
- Keep generated artifacts with their source change (`worker-configuration.d.ts`, `mise.lock`, lockfiles).
- Run the narrowest useful checks while working, then the relevant format, lint, typecheck, test, and build tasks for the packages you touched.
- Follow the existing package's style. Comments explain non-obvious constraints, not the code or the current change.
- Do not add file banners, author or date headers, or comment-based change logs. Git owns provenance and history.
- Write prose from the repository's point of view. Use `we` and `our` for the organisation, and `the app` or direct wording for this repository. Omit organisation and product names when context already identifies them; keep names that are identifiers or distinguish an external system.
- Keep tracked documentation durable and present-tense. READMEs use a terse introduction and the relevant established emoji-led sections; omit migration history, temporary setup state, and inventories of absent features.
- Keep one-time local and external-service setup notes out of tracked files. If asked to preserve them locally, leave them untracked without adding ignore or exclude rules.

## TypeScript

- Write idiomatic, strict TypeScript. `packages/core` stays framework-free — it owns lesson-HTML parsing, slide assembly, resource matching, and presentation generation, and exposes a typed API the app consumes; UI concerns stay out of it.
- Prefer a well-maintained npm package over hand-rolled logic (zip reading, schema validation, date/URL handling, and similar) — check for one before writing custom code.
- `apps/web` is a Vite + React app. Compose the UI from shadcn/ui primitives under `src/components/ui`; add new primitives with the shadcn CLI rather than hand-writing them. Keep application components outside `components/ui`.
- Style with Tailwind CSS utility classes and the theme tokens in `src/index.css`. Avoid ad hoc inline styles or a parallel CSS file.
- Match the package's testing style (Vitest) and use synthetic inputs — no real lesson content or student data in tests or fixtures.

## Git and releases

- Use focused Conventional Commits.
- Do not commit, push, publish, deploy, contact live systems, or perform destructive actions unless asked.

## Repository notes

- The app takes a Seqta lesson page's HTML and its resource files and produces an editable PowerPoint, following fixed, deterministic layout rules — no AI, no OCR, no per-lesson judgement calls.
- Everything runs client-side in the browser tab. Cloudflare only serves the static build; it never sees lesson content.
- Real lesson content, resource files, and student data never belong in tests, fixtures, or commits.
