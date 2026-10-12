# GitHub Actions CI

[Documentation index](README.md) · [Development](development.md)

The [CI workflow](../.github/workflows/ci.yml) validates pull requests, pushes to
`main`, merge queues and manual runs. Each run checks the project on Ubuntu 24.04
with the latest available Node 24 and Node 26 releases. Both must pass.

## What runs

Each Node job runs these commands in order:

| Command                | Purpose                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm ci`               | Install exact locked dependencies; the prepare script creates the library package.                             |
| `npm run lint`         | Check formatting and ESLint rules.                                                                             |
| `npm run check`        | Check Svelte components and TypeScript.                                                                        |
| `npm test`             | Run the full Vitest suite once, including SSR tests.                                                           |
| `npm run build`        | Build the playground and library, then validate the real npm archive with publint and export/exclusion checks. |
| `npm run test:bundles` | Build consumers through public exports and reject unrelated dependencies or CSS.                               |

The bundle checks depend on the preceding build. npm's download cache is keyed by
the lockfile; each job still installs dependencies with `npm ci`. Changes to
`package.json` must include the corresponding `package-lock.json` updates.

There are no path filters, so documentation-only pull requests also receive the
required check. New runs cancel obsolete runs for the same event and ref. A failure
on one Node version does not cancel the other version's validation.

The current dependency tree requires Node 24.15.0 or newer within the Node 24 line;
`.npmrc` enforces dependency engines. Using a major version in the workflow lets
setup-node select current patches. The matrix tests these two development runtimes;
it does not prove compatibility with every Svelte version in the peer range.

## Enable merge protection

After committing and pushing the workflow, open the repository's **Actions** tab
and inspect the first run. Once it completes, create or update a branch ruleset for
`main` under **Settings → Rules → Rulesets** and require the status check
**CI passed**. Repository settings must be configured separately from these files.

`CI passed` is a stable gate over both matrix jobs. It fails when validation fails,
is cancelled or is skipped, so a skipped dependency cannot accidentally permit a
merge. Keep this check name stable when changing the Node matrix. The `merge_group`
trigger allows the same check to run if a merge queue is enabled later.

For manual runs, select **Actions → CI → Run workflow** after the workflow reaches
the default branch. To diagnose a failure, open the failed step in
`Validate (Node 24)` or `Validate (Node 26)` and run its command locally using that
Node version. For a clean reproduction, start with `npm ci`; it replaces the local
`node_modules` directory.

## Permissions and updates

The validation jobs use read-only repository contents permission, disable persisted
checkout credentials and require no npm token or deployment secrets. Contributed
code runs through `pull_request`. Actions are pinned to full release commit SHAs,
following [GitHub's workflow security guidance](https://docs.github.com/en/actions/reference/security/secure-use).

[Dependabot configuration](../.github/dependabot.yml) checks GitHub Actions weekly
and groups action updates into one pull request. Review and merge these updates
after CI passes; automatic merging is not configured. See the
[Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).
First-time contributor approval and Actions policies are controlled by GitHub
repository settings.

## Possible extensions

- Browser smoke tests for theme changes, dialog focus/Escape, toast dismissal,
  carousel navigation and mobile layout. jsdom tests cannot prove browser layout
  or native pointer behavior.
- An isolated consumer build using the minimum supported Svelte version.
- npm dependency update PRs and CodeQL analysis, configured separately when needed.

## Publishing and demo hosting

This workflow validates changes. Releases remain manual. A future release workflow
can use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) after
validation, with publishing restricted to the maintained repository and environment.

The playground uses adapter-auto and has no GitHub Pages deployment configuration.
Hosting it on Pages requires static prerendering/adapter-static, the repository base
path and asset/navigation checks. Choose the deployment target before adding a
deployment job.
