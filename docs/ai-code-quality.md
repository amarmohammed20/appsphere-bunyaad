# How do you make a codebase where most code is AI-written, without quality collapsing?

Working document. We add research here, then decide.

## The problem

Most of our code is now **written** by AI. AI produces code that runs but is often
poor quality — inconsistent naming, oversized components, logic in the wrong
layer, `any` and `as` everywhere, duplicated helpers, no reuse.

We cannot review every line. So the question is not "how do we write better
prompts" — it is "what does the repository itself enforce, so bad code cannot
land regardless of what the agent intended".

Bunyaad is where that answer gets built once and reused.

## The shape of the answer so far

Everything we have read converges on three layers:

| Layer                | Mechanism                        | Catches                              |
| -------------------- | -------------------------------- | ------------------------------------ |
| Enforce mechanically | Lint, types, tests, hooks        | Rule violations                      |
| Inform early         | AGENTS.md, skills, ADRs          | Wrong approach before it is written  |
| Verify independently | Review subagents, E2E, PR review | Judgement — is this the right design |

Lint sees shape. It cannot see intent. That boundary decides what goes where.

## Research log

### Harness engineering best practices 2026

<https://nyosegawa.com/en/posts/harness-engineering-best-practices-2026/>

- "The system, not the model, is what matters." Same model, different harness,
  dramatically different output.
- **Feedback speed determines quality.** PostToolUse hook (ms) > pre-commit (s)
  > CI (min) > human review (hours). Move checks to faster layers.
- "Don't make the LLM do the linter's job." Deterministic tools for
  deterministic rules.
- Lint messages should be `ERROR: what / WHY: why the rule exists / FIX: how`.
  An agent told how to fix it, fixes it.
- **AGENTS.md should be pointers, under ~50 lines.** Prose rots silently; a
  broken pointer fails loudly.
- Keep only executable artifacts and ADRs in the repo. Tests instead of docs —
  "tests can't lie when you run them".
- PreToolUse hook to stop agents editing lint configs to silence errors.
- Stop hook so an agent cannot declare done until tests pass.
- Add a test for every mistake an agent makes. The suite becomes a record of
  how AI fails on _our_ codebase.
- Recommends Oxlint over ESLint for speed. Open question for us — we would lose
  `eslint-config-next` rules.

### typescript-eslint

<https://typescript-eslint.io/getting-started/typed-linting/>

- Type-aware linting via `projectService: true` unlocks the highest-value rules
  (`no-floating-promises`, `no-unsafe-*`, `no-unnecessary-type-assertion`).
- Cost is "a few seconds or less" on small projects; IDE plugins cache it.
- `naming-convention` supports boolean prefixes (`is`/`has`/`should`/`can`) but
  is feature-frozen and needs type information.

### Our own finding

- **Rules must be `error`, not `warn`.** Agents ignore warnings. They only
  self-correct when the command fails.

### gstack (Garry Tan)

Cloned locally at `../gstack`.

- Turns Claude Code into a virtual engineering team: 23 specialist roles as
  slash commands — CEO, eng manager, designer, reviewer, QA, security, release.
- Worth studying rather than vendoring wholesale — its roles assume a generic
  stack, ours can know `dbCalls/`, RLS, and our migration workflow.

### eslint-plugin-boundaries

<https://github.com/javierbrea/eslint-plugin-boundaries>

- Supports ESLint 9 flat config.
- Classifies files into architectural element types, then declares which types
  may import which.
- **`default: "disallow"` is the reason to pick this.** You list what is
  allowed; everything else is blocked. `import/no-restricted-paths` works the
  other way — you list what is forbidden, so anything unanticipated is allowed.
- Deny-by-default matters when an agent writes the code: it cannot find a path
  we did not think to forbid.
- Only usable once the folder structure exists.

### App Build Guard Rails (internal PDF)

- Our existing standards doc. Section 12 already names the foundation repo idea
  and the sync problem.
- Predates the AI-native framing — it is about human process, not agent
  enforcement. Still the source of truth for security and environment setup.

### Oxlint vs ESLint

<https://betterstack.com/community/guides/scaling-nodejs/oxlint-vs-eslint/>
<https://www.pkgpulse.com/guides/oxlint-vs-eslint-2026>
<https://oxc.rs/docs/guide/usage/linter.html>
<https://gist.github.com/tkrotoff/8e10c7d63f97b3480a98301af9e8a28e>

- Speed is not marginal. 4,800 files: **0.7s vs 30–50s**. Benchmarked at
  ~11,774 files/sec vs ESLint's ~125. Rust, parallel across cores; ESLint is
  single-threaded JS.
- Real user reports: "81s to 25s", "12 seconds down to 2 seconds".
- ESLint with type-aware linting hits **85s** where Oxlint is under 1s. This is
  the number that matters for a PostToolUse hook.
- **Sources disagree on type-aware support.** Betterstack calls it experimental
  ("tsgolint" preview). The official oxc docs say it uses the Go port of the TS
  compiler and handles "mission critical checks that require types, such as
  detecting floating promises". Official docs are newer — verify ourselves
  before relying on it.
- Same disagreement on jsx-a11y: Betterstack says Oxlint has no accessibility
  rules; oxc docs list jsx-a11y among supported plugins. Verify.
- Official docs claim **845 rules**, covering ESLint core, TypeScript, React,
  Jest, Vitest, Import, Unicorn, jsx-a11y.
- Known gaps from community: `naming-convention`, `prefer-destructuring`.
  `naming-convention` is one we specifically want.
- **`eslint-plugin-oxlint` disables overlapping ESLint rules so both can run.**
  This is the key integration piece — not either/or.
- `oxlint-migrate` converts an existing ESLint config; unsupported rules are
  commented out for manual review.
- v1.0 August 2025. In production at Shopify, Mercedes-Benz, Airbnb.
- Every source lands on the same recommendation: **Oxlint for fast feedback
  during development, ESLint for full checks in CI.**

### Claude Code hooks

<https://github.com/FlorianBruniaux/claude-code-ultimate-guide>
<https://dotzlaw.com/insights/claude-hooks/>
<https://adambailey.io/blog/claude-hooks-lint-tests>

- **"Hooks guarantee behavior; prompts suggest it."** Prompts achieve 70–90%
  compliance. Hooks achieve 100%, because they run outside the model's
  reasoning chain. This is the single most important line in all the research.
- 30 events across 8 categories. The ones that matter to us:
  - `PreToolUse` — fires before a tool runs. **Exit 2 blocks it**, stderr goes
    to the agent.
  - `PostToolUse` — fires after. Feed results back via
    `hookSpecificOutput.additionalContext` so the agent self-corrects.
  - `Stop` — gate completion. Agent cannot declare done until it passes.
  - `SessionStart` — inject context at session open.
  - `SubagentStop` — validate a subagent's output.
- Config lives in `.claude/settings.json` under `hooks`, with a `matcher`
  (`"Edit|Write"`, `"Bash"`, `".*"`), a command, and an optional `timeout`.
- **`"async": true`** runs a hook without blocking the agent. Correct for
  formatting; wrong for validation.
- Hooks receive JSON on stdin (`tool_name`, `tool_input.file_path`) and may
  return JSON with `systemMessage` or `additionalContext`.
- Three hook types, not just shell: **command**, **prompt-based** (single-turn
  model call for judgement), **agent-based** (multi-turn review).
- Four production patterns: safety gates, quality feedback loop, observability
  pipeline, completion gates.
- **Per-agent embedded hooks beat global hooks** — only relevant validation runs
  for each specialist.

### The independent evaluator principle

From `verification-gate.sh` in the ultimate-guide repo:

> "The agent that writes code should not be the same invocation that certifies
> it done."

A PostToolUse hook runs lint then tests, silent on success, `exit 2` with output
on failure. The writing agent does not get to mark its own homework — a separate
process reads exit codes without the charitable interpretation that context bias
produces.

### Things we had not considered

Found while reading, worth stealing:

- **`permissions.deny` in `.claude/settings.json`.** Block `Read(.env)`,
  `Read(**/*.pem)`, `Read(**/credentials*)`, `Read(**/id_rsa*)` outright. Ten
  lines, no script, stops secrets entering context at all. Cheapest win here.
- **`.agentignore` / `.aiignore`** — a gitignore-style file listing paths agents
  may not touch, read by a `file-guard` PreToolUse hook.
- **Layered hook order matters**: lint first (fast, fails on syntax), tests
  second. Fail cheap before failing expensive.
- **`output-secrets-scanner`** — scans agent _output_ for secrets, not just
  files. Different failure mode to a repo secret scanner.
- **`prompt-injection-detector`** — relevant once agents read external content.
- **Session handoff commands** (`create-handoff`, `resume-handoff`) — state
  across sessions as an explicit artifact rather than hoping context survives.
- **BM25 skill routing** — index skills, auto-suggest the right one for a
  prompt instead of relying on the agent to pick.
- **Plan review as separate roles** — `plan-challenger`, `plan-ceo-review`,
  `plan-eng-review`. An agent that argues against the plan before code exists.
- **`adr-writer` agent** — ADRs get written as a side effect of decisions.
- **`learning-capture` hook** — records lessons as they happen, feeding the
  "add a test for every agent mistake" practice.

### Oxlint — our own measurements

Tested directly, not read. Scratch project plus bunyaad itself.

- **Type-aware linting is stable**, not experimental. oxc docs confirm, and it
  worked first try. 59 of 61 typescript-eslint type-aware rules supported.
- Enable with `--type-aware` or `options.typeAware: true`. Requires the extra
  package `oxlint-tsgolint`.
- Caught `no-floating-promises` correctly on a deliberate test case.
- **The "TypeScript 7 required" note is misleading.** `oxlint-tsgolint` bundles
  its own compiler — it worked fine with the project on TypeScript 5.9.3. We do
  not need to upgrade TypeScript to use it.
- Plain oxlint (no type info) caught **nothing** in the test file. The value is
  entirely in the type-aware layer.
- Timings on bunyaad (3 source files):
  - Oxlint: **0.85s**
  - ESLint: **7.7s** warm, ~116s on a cold first run
- The cold-start number was an outlier, but 7.7s on three files is the real
  finding: **ESLint is already too slow for a per-file-write hook, on an empty
  project.** It only gets worse.
- `baseUrl` in tsconfig is unsupported. We use `paths` without `baseUrl`, so
  this does not affect us.

### Claude Code hooks — official reference

<https://code.claude.com/docs/en/hooks>

Much richer than the blog posts suggested.

- **Five handler types**, not just shell: `command`, `http`, `mcp_tool`,
  `prompt` (single-turn model call), `agent` (spawns a subagent, experimental).
  A `prompt` hook means a hook _can_ make judgement calls — this partly
  dissolves the "lint cannot see intent" limit.
- **`if` field for conditional firing**: `"if": "Bash(git *)"`. Narrower than
  matcher, avoids running hooks that will immediately no-op.
- **`updatedInput`** — a PreToolUse hook can _rewrite the tool's arguments_
  before it runs, not just allow or deny.
- **`updatedToolOutput`** — a PostToolUse hook can rewrite the result the agent
  sees.
- **`permissionDecision: "deny" | "allow" | "ask" | "defer"`** — richer than
  exit codes.
- **`continue: false`** stops Claude entirely.
- **`FileChanged` event** with a filename matcher, e.g. `".env|.envrc"`. Fires
  on file changes regardless of which tool made them.
- **`SessionStart`** can inject `initialUserMessage`, `watchPaths`,
  `sessionTitle`, and `reloadSkills`.
- **`Stop` and `SubagentStop` can block** and hand back feedback via
  `additionalContext` — this is the completion gate.
- PostToolUse **cannot** block (the tool already ran). Blocking must be
  PreToolUse or Stop.
- Settings scopes: `~/.claude/settings.json` (personal, not shared),
  `.claude/settings.json` (project, shared), `.claude/settings.local.json`
  (project, not shared). **Shared team hooks go in `.claude/settings.json`.**
- Exec form (`args` array) avoids shell quoting problems — safer on Windows.
- `allowManagedHooksOnly` lets an org block user/project hooks entirely.

### Testing strategy

<https://www.pkgpulse.com/guides/vitest-jest-playwright-complete-testing-stack-2026>

- **Vitest over Jest** for Next.js: native ESM (Jest needs config gymnastics),
  10–20x faster cold start. Next.js' own testing docs use Vitest.
- Clean split:
  - **Vitest** — server actions as plain functions, Zod schemas, helpers, sync
    components, client components via Testing Library.
  - **Playwright** — auth flows, form submissions hitting real endpoints, async
    server components, anything touching cookies, middleware, or the router.
- Suggested shape: thorough unit tests for logic, integration tests for data
  access and API routes, **20–30 Playwright E2E tests for critical paths only**
  — deliberately not a fifteen-minute suite.

## Decisions made

- Lint rules go to `error`, not `warn`.
- Type-aware linting is worth the speed cost.
- Architecture rules use `eslint-plugin-boundaries` with `default: "disallow"`,
  not `import/no-restricted-paths`. Deny-by-default over deny-by-list.
- Architecture rules wait until the folder structure exists.
- gstack: study and adapt, do not vendor.

### Spike: does Oxlint + ESLint actually work with Next?

Ran it. Copy of bunyaad in a scratch dir, deliberate violations in one file.

**It works.** ESLint alone found 5 problems. With
`oxlint.buildFromOxlintConfigFile('.oxlintrc.json')` added last, it found 2 —
and exactly the right 2:

| Rule                        | ESLint alone | With dedup | Owner after split |
| --------------------------- | ------------ | ---------- | ----------------- |
| `no-unused-vars` x2         | found        | removed    | Oxlint            |
| `no-explicit-any`           | found        | removed    | Oxlint            |
| `@next/next/no-img-element` | found        | **kept**   | ESLint            |
| `jsx-a11y/alt-text`         | found        | **kept**   | ESLint            |

Gotchas found by doing it:

- **Named imports fail.** `import { buildFromOxlintConfigFile }` throws — the
  package is CJS. Use `import oxlint from 'eslint-plugin-oxlint'` then
  `oxlint.buildFromOxlintConfigFile(...)`.
- Prefer `buildFromOxlintConfigFile` over the static `flat/recommended` config —
  it derives the disable list from our actual `.oxlintrc.json` rather than
  guessing.
- **`react/react-in-jsx-scope` fires as a false positive** and must be turned
  off. It is wrong for React 17+ / the modern JSX transform. A default Oxlint
  config reports two bogus errors per JSX file.
- Versions of `oxlint` and `eslint-plugin-oxlint` must match (peer dep is
  `~`-pinned). Bump them together.

Measured timings, same single file:

| Command               | Cold  | Warm     |
| --------------------- | ----- | -------- |
| Oxlint plain          | 1.6s  | 1.6s     |
| Oxlint `--type-aware` | 12.7s | **2.4s** |
| ESLint                | >5min | 22–29s   |

- The 12.7s type-aware figure was cold start (tsgolint init). Warm is ~2.4s.
- ESLint in this spike was much slower than in bunyaad (22s vs 7.7s) — npm
  install rather than pnpm, and cold caches. Either way the ratio holds.
- **Dedup does not make ESLint faster.** Its value is removing duplicate
  reports, not speed — ESLint's time is dominated by config loading, not rule
  execution. Do not sell it as a performance win.

## Answered by testing, not reading

- **Does Oxlint type-aware work?** Yes. Stable, verified on a real case.
- **Does it need TypeScript 7?** No. `oxlint-tsgolint` bundles its own compiler
  and worked against TypeScript 5.9.3.
- **Is ESLint fast enough for a write-time hook?** No. 7.7s on three files.

## Open questions

- `naming-convention` is missing from Oxlint and we want it. ESLint-only in the
  slow layer, or write a custom rule?
- Does Oxlint have usable jsx-a11y rules? Sources still disagree; untested.
- Does `eslint-plugin-oxlint` cleanly disable overlapping rules inside
  `eslint-config-next`? Untested.
- How short should AGENTS.md really be, and what does it point _at_?
- Do we adopt ADRs, and where do they live?
- How much prose documentation is for humans and therefore exempt from the
  "docs rot" argument?
- Are `prompt` hooks worth the latency for judgement calls lint cannot make, or
  is that the review subagents' job?

## To read

- Simon Willison on agentic coding
- Hacker News threads on harness engineering and agentic coding
- gstack `ETHOS.md` and `ARCHITECTURE.md`
- AGENTS.md spec and real-repo examples
