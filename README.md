# slideforge

Turns a Seqta lesson page into an editable PowerPoint. Paste the lesson's HTML, add its resource files, and it lays the content out onto slides using fixed, predictable rules — no AI, no manual slide-building.

Everything runs in the browser tab. There is no backend and no upload: the lesson content and resource files a teacher works with never leave their device.

## 🚀 Usage

Open the deployed app, paste the lesson HTML from Seqta, add the exported resources folder or ZIP, and forge. The result downloads as a `.pptx` you can edit like any other PowerPoint.

## 🧑‍💻 Development

```bash
mise install
mise run deps
mise run dev
```

`apps/web` is the Vite + React app; `packages/core` is the framework-free parsing and generation logic it depends on. Scope a task to one package with `mise run //<package>:<task>`, for example:

```bash
mise run //packages/core:test
mise run //apps/web:lint
```

## 📦 Deployment

Cloudflare Workers builds and deploys the app directly from the repository on every push to `main` — there is no deploy step in CI. `apps/web/wrangler.jsonc` configures the Worker as a static asset host with single-page-app fallback.

## 📄 License

© M Scott. Internal Woodleigh School tool — not for redistribution outside the school without permission. See the terms shown on first launch.
