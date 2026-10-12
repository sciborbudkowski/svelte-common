# Development and release

[Documentation index](README.md) · [Source entry point](../src/lib/index.ts)

## Repository layout

| Path                                                                                 | Role                                                                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/lib/index.ts`                                                                   | Supported package exports.                                                                       |
| `src/lib/ui/`                                                                        | UI components; Accordion/Modals subdirectories group related components.                         |
| `src/lib/ui/internal/`, `src/lib/utils/focus.ts`, `src/lib/utils/overlays.svelte.ts` | Internal icons, controlled-state ownership, inert synchronization, focus traversal and overlays. |
| `src/lib/stores/`                                                                    | Runes state for theme, GPS, modals, loader and toasts.                                           |
| `src/lib/services/`                                                                  | HTTP/cache interfaces, WebSocket client and storage.                                             |
| `src/lib/utils/`                                                                     | Small application helpers.                                                                       |
| `src/lib/styles.css`, `src/lib/styles/`                                              | Public CSS entry and style modules.                                                              |
| `src/lib/debug/`                                                                     | SizeView.                                                                                        |
| `src/routes/`                                                                        | Interactive component and CSS-helper playground.                                                 |
| `docs/`                                                                              | Guides/references and historical audits.                                                         |
| `scripts/validate-package.mjs`                                                       | Real-tarball package validator.                                                                  |
| `dist/`, `.svelte-kit/`                                                              | Generated outputs, ignored by Git.                                                               |

Files ending `.svelte.ts` contain Svelte runes and require Svelte compilation.
The development Vite configuration forces runes for project files, excluding
dependencies. The project uses TypeScript with strict checking and NodeNext module
resolution. Relative `.ts` imports are rewritten in generated package output.

## Local setup and scripts

Use an installed Node/npm combination satisfying the dependencies' engine ranges.
There is no project `engines` declaration; `.npmrc` enables `engine-strict`.
The lockfile supplies reproducible dependency versions. `npm ci` performs the
preparation/package build as part of install.

```sh
npm ci
npm run dev
```

| Command               | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Vite development server with SvelteKit.                     |
| `npm run preview`     | Preview the built development app.                          |
| `npm run package`     | SvelteKit sync and svelte-package, generating `dist`.       |
| `npm run prepare`     | Delegates to package; invoked by package-manager lifecycle. |
| `npm run check`       | SvelteKit sync and svelte-check.                            |
| `npm run check:watch` | Watch type/component diagnostics.                           |
| `npm run test:unit`   | Vitest watch workflow.                                      |
| `npm test`            | All Vitest projects once.                                   |
| `npm run lint:format` | Prettier check.                                             |
| `npm run lint:code`   | ESLint check.                                               |
| `npm run lint`        | Formatting then ESLint.                                     |
| `npm run format`      | Writes repository formatting.                               |
| `npm run prepack`     | Package generation then real archive validation.            |
| `npm run build`       | Vite SSR/client app build then prepack.                     |

`CollapsibleTabBar.svelte` is intentionally unfinished and ignored by Prettier at
the owner's request. It remains exported, so it still participates in compilation;
do not interpret its presence as a finished public tab API.

## Tests

[Main configuration](../vite.config.ts) · [Client configuration](../vitest.client.config.ts)

Vitest runs two projects:

| Project | Environment                          | Match                                       |
| ------- | ------------------------------------ | ------------------------------------------- |
| client  | jsdom with browser Svelte resolution | `src/**/*.svelte.{test,spec}.{js,ts}`       |
| server  | Node                                 | Other `src/**/*.{test,spec}.{js,ts}` files. |

The client configuration aliases `$lib` to source and compiles mounted Svelte
components. Server tests include store/service unit tests and SSR rendering.
`expect.requireAssertions` is enabled. Fixtures live under `src/lib/ui/fixtures`.

```sh
npm run test:unit -- --project client --run
npm run test:unit -- --project server --run
```

Regression coverage includes API/cache/download failures, SSR, modal action/focus
ownership, toast reentrancy, loader progress/stacking, GPS generations, theme cleanup,
WebSocket deadlines, carousel failure/motion and scrolling observer cleanup.
Some DOM tests mock transitions/GSAP/browser APIs; jsdom does not reproduce real layout,
pointer capture, screen readers or mobile file-saving behavior. Validate those in
real browsers when changing the corresponding features.

## Packaging

[Metadata](../package.json) · [Validator](../scripts/validate-package.mjs)

The package exports its Svelte entry/types, explicit feature subpaths, the four
aggregate CSS entries and eight individual CSS modules; see
[selective imports](selective-imports.md). CSS is declared as a
side effect so bundlers retain the stylesheet import. `files` ships `dist` while
excluding test/spec files, fixtures and the unfinished CollapsibleTabBar draft. npm also includes standard package metadata/
README files; the `docs` directory is repository documentation, not currently listed
as a distributed package directory.

The validator creates a temporary directory, runs `npm pack --ignore-scripts`,
locates the actual `.tgz` without relying on npm stdout, and passes its bytes to
publint. It also checks every export target, the license/notices, and exclusions
against the archive contents. Error-level messages fail the process; temporary files
are removed in finally.
This avoids recursive prepack and validates a real package rather than only loose
files. `npm run build` also builds the preview app; `npm run package` alone does not
run archive validation.

```sh
npm run lint
npm run check
npm test
npm run build
```

Before release, review exports, peer compatibility, generated declarations and
tarball contents; update version/changelog and migration notes as appropriate.
The repository does not define a publish/deploy script or license field/file, and
these guides do not establish registry availability or licensing terms. Publishing
or deployment is a separate maintainer action.

## Maintaining documentation

See [API migration](api-migration.md) for current ownership and compatibility.
Update prop tables/defaults and lifecycle descriptions with implementation changes.
Keep the public API map in [docs/README.md](README.md) aligned with index.ts. Use
copyable Svelte snippets with imports and TypeScript narrowing for queued API results.
Keep historical audit results separate from current behavior.

For a documentation-only change, check Markdown formatting, relative links/anchors
and examples against the current source. For behavior changes, run the applicable
tests and full release checks. Do not add an internal helper to index.ts just to make
a documentation example compile.

## Consumer bundles and public-project maintenance

After `npm run package` or `npm run build`, run `npm run test:bundles`. It builds
small consumer applications through actual package exports and rejects unrelated
heavy dependencies. See [selective imports](selective-imports.md) for coverage and
limits. The validator uses the already locked @publint/pack dependency directly
when inspecting archives; it does not depend on a system tar executable.

The project uses [MIT](../LICENSE), with packaged [third-party notices](../THIRD_PARTY_NOTICES.md).
[GitHub Actions CI](github-actions.md) runs the validation commands on Node 24 and 26.
