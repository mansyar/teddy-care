# Project Workflow — Teddy Care

> Toolchain: pnpm · Biome (lint+format) · Vitest · Playwright · strict TypeScript.
> Package versions are resolved fresh at scaffold time (see Track 1 plan).

## Guiding Principles

1.  **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2.  **The Tech Stack is Deliberate:** Changes to the tech stack must be
    documented in `tech-stack.md` *before* implementation
3.  **Test-Driven Development for logic-bearing code:** Write Vitest unit tests
    before implementing stats engine, timers, persistence, game mechanics, and
    other logic. Purely presentational components (layout, static styling,
    asset placement with no branching) are exempt — verify those via
    Playwright and manual checks instead.
4.  **High Coverage Where It Counts:** Aim for >80% coverage on
    logic-bearing modules. No coverage quota on presentational code.
5.  **User Experience First:** Every decision should prioritize the 4-year-old
    player and the trusting parent (see `product-guidelines.md`)
6.  **Non-Interactive & CI-Aware:** Prefer non-interactive commands. Use
    `CI=true` for watch-mode tools (tests, linters) to ensure single execution.

## Task Workflow

All tasks follow a strict lifecycle:

### Standard Task Workflow

1.  **Select Task:** Choose the next available task from `plan.md` in sequential
    order

2.  **Mark In Progress:** Before beginning work, edit `plan.md` and change the
    task from `[ ]` to `[~]`

3.  **Write Failing Tests (Red Phase)** — *logic-bearing tasks only:*

    -   Create a new test file for the feature or bug fix.
    -   Write one or more unit tests that clearly define the expected behavior
        and acceptance criteria for the task.
    -   **CRITICAL:** Run the tests and confirm that they fail as expected. This
        is the "Red" phase of TDD. Do not proceed until you have failing tests.
    -   *Presentational tasks:* skip to step 4; note the Playwright/manual
        verification plan in the task instead.

4.  **Implement to Pass Tests (Green Phase):**

    -   Write the minimum amount of application code necessary to make the
        failing tests pass (or to meet the verification plan).
    -   Run the test suite again and confirm that all tests now pass. This is
        the "Green" phase.

5.  **Refactor (Optional but Recommended):**

    -   With the safety of passing tests, refactor the implementation code and
        the test code to improve clarity, remove duplication, and enhance
        performance without changing the external behavior.
    -   Rerun tests to ensure they still pass after refactoring.

6.  **Verify Coverage (logic-bearing code):** Run coverage for touched
    logic modules (e.g., `pnpm vitest run --coverage`). Target: >80% for new
    logic code.

7.  **Document Deviations:** If implementation differs from tech stack:

    -   **STOP** implementation
    -   Update `tech-stack.md` with new design
    -   Add dated note explaining the change
    -   Resume implementation

8.  **Commit Code Changes:**

    -   Stage all code changes related to the task.
    -   Propose a clear, concise commit message e.g, `feat(care): Add hunger
        stat decay over wall-clock time`.
    -   Perform the commit.

9.  **Attach Task Summary with Git Notes:**

    -   **Step 9.1: Get Commit Hash:** Obtain the hash of the *just-completed
        commit* (`git log -1 --format="%H"`).
    -   **Step 9.2: Draft Note Content:** Create a detailed summary for the
        completed task. This should include the task name, a summary of changes,
        a list of all created/modified files, and the core "why" for the change.
    -   **Step 9.3: Attach Note:** Use the `git notes` command to attach the
        summary to the commit. `bash # The note content from the previous step
        is passed via the -m flag. git notes add -m "<note content>"
        <commit_hash>`

10. **Get and Record Task Commit SHA:**

    -   **Step 10.1: Update Plan:** Read `plan.md`, find the line for the
        completed task, update its status from `[~]` to `[x]`, and append the
        first 7 characters of the *just-completed commit's* commit hash.
    -   **Step 10.2: Write Plan:** Write the updated content back to `plan.md`.

11. **Commit Plan Update:**

    -   **Action:** Stage the modified `plan.md` file.
    -   **Action:** Commit this change with a descriptive message (e.g.,
        `conductor(plan): Mark task 'Create hunger stat' as complete`).

### Task Correction & Plan Amendment Workflows

When an implemented task or phase requires corrections, amendments, or additions, follow these standard workflows to maintain plan integrity and avoid untracked code drift:

1.  **In-Flight Refinements:** If minor gaps are found while a task is actively
    in-progress (`[~]`), make the adjustments directly in the active
    implementation stream and ensure passing tests before committing.
2.  **Code Review Corrections (`conductor-review`):** If issues are identified
    during or after a code review, instruct the agent to review your changes
    (e.g., *"run a review"* or triggering the action manually in compatible
    clients). The review agent will automatically append a `Review Fixes` phase
    to `plan.md` so that correction tasks are formally tracked and
    checkpointed.
3.  **Logical State Reversions (`conductor-revert`):** If a task implementation
    is fundamentally flawed or needs to be redone, instruct the agent to revert
    the changes (e.g., *"revert the last task"* or triggering the action
    manually in compatible clients). This safely rolls back associated git
    commits and resets the task state in `plan.md` back to pending `[ ]` to
    allow a clean restart.

### Phase Completion Verification and Checkpointing Protocol

**Trigger:** This protocol is executed immediately after a task is completed
that also concludes a phase in `plan.md`.

1.  **Announce Protocol Start:** Inform the user that the phase is complete and
    the verification and checkpointing protocol has begun.

2.  **Ensure Test Coverage for Phase Changes:**

    -   **Step 2.1: Determine Phase Scope:** To identify the files changed in
        this phase, you must first find the starting point. Read `plan.md` to
        find the Git commit SHA of the *previous* phase's checkpoint. If no
        previous checkpoint exists, the scope is all changes since the first
        commit.
    -   **Step 2.2: List Changed Files:** Execute `git diff --name-only
        <previous_checkpoint_sha> HEAD` to get a precise list of all files
        modified during this phase.
    -   **Step 2.3: Verify and Create Tests:** For each file in the list:
        -   **CRITICAL:** First, check its extension. Exclude non-code files
            (e.g., `.json`, `.md`, `.yaml`) and purely presentational
            components (no branching/logic — covered by Playwright instead).
        -   For each remaining logic-bearing file, verify a corresponding test
            file exists.
        -   If a test file is missing, you **must** create one. Before writing
            the test, **first, analyze other test files in the repository to
            determine the correct naming convention and testing style.** The new
            tests **must** validate the functionality described in this phase's
            tasks (`plan.md`).

3.  **Execute Automated Tests with Proactive Debugging:**

    -   Before execution, you **must** announce the exact shell command you will
        use to run the tests.
    -   **Example Announcement:** "I will now run the automated test suite to
        verify the phase. **Command:** `CI=true pnpm test`"
    -   Execute the announced command.
    -   If tests fail, you **must** inform the user and begin debugging. You may
        attempt to propose a fix a **maximum of two times**. If the tests still
        fail after your second proposed fix, you **must stop**, report the
        persistent failure, and ask the user for guidance.

4.  **Propose a Detailed, Actionable Manual Verification Plan:**

    -   **CRITICAL:** To generate the plan, first analyze `product.md`,
        `product-guidelines.md`, and `plan.md` to determine the user-facing
        goals of the completed phase.
    -   You **must** generate a step-by-step plan that walks the user through
        the verification process, including any necessary commands and specific,
        expected outcomes.
    -   The plan you present to the user **must** follow this format:

        **For a Frontend Change:** ``` The automated tests have passed. For
        manual verification, please follow these steps:

        **Manual Verification Steps:** 1. **Start the development server with
        the command:** `pnpm dev` 2. **Open your browser to:**
        `http://localhost:5173` 3. **Confirm that you see:** Teddy on the care
        screen, breathing gently, with all four care buttons responding within
        300ms. ```

5.  **Await Explicit User Feedback:**

    -   After presenting the detailed plan, ask the user for confirmation:
        "**Does this meet your expectations? Please confirm with yes or provide
        feedback on what needs to be changed.**"
    -   **PAUSE** and await the user's response. Do not proceed without an
        explicit yes or confirmation.

6.  **Identify Target Commit for Report:**

    -   Do NOT create a new empty commit for checkpointing.
    -   Identify the hash of the last functional commit made during this phase. This will be the target for the verification report.

7.  **Attach Auditable Verification Report using Git Notes:**

    -   **Step 7.1: Draft Note Content:** Create a detailed verification report
        including the automated test command, the manual verification steps, and
        the user's confirmation.
    -   **Step 7.2: Attach Note:** Use the `git notes` command to attach the full report to the target commit identified in step 6.

8.  **Get and Record Phase Checkpoint SHA:**

    -   **Step 8.1: Get Commit Hash:** Obtain the hash of the *just-created
        checkpoint commit* (`git log -1 --format="%H"`).
    -   **Step 8.2: Update Plan:** Read `plan.md`, find the heading for the
        completed phase, and append the first 7 characters of the commit hash in
        the format `[checkpoint: <sha>]`.
    -   **Step 8.3: Write Plan:** Write the updated content back to `plan.md`.

9.  **Commit Plan Update:**

    -   **Action:** Stage the modified `plan.md` file.
    -   **Action:** Commit this change with a descriptive message following the
        format `conductor(plan): Mark phase '<PHASE NAME>' as complete`.

10. **Announce Completion:** Inform the user that the phase is complete and the
    checkpoint has been created, with the detailed verification report attached
    as a git note.

### Quality Gates

Before marking any task complete, verify:

-   [ ] All tests pass
-   [ ] Coverage meets requirements (>80% on touched logic-bearing modules)
-   [ ] Code follows project's code style guidelines (as defined in
    `code_styleguides/`)
-   [ ] All public functions/methods are documented (JSDoc)
-   [ ] Type safety is enforced (strict TypeScript, no `any` without justification)
-   [ ] No Biome lint/format errors
-   [ ] Works correctly on mobile 360px portrait (if user-facing)
-   [ ] Touch targets ≥48px (if user-facing)
-   [ ] Documentation updated if needed
-   [ ] No security vulnerabilities introduced (no network calls, no eval, no
    hardcoded secrets)

## Development Commands

### Setup

```bash
pnpm install
```

### Daily Development

```bash
pnpm dev          # Vite dev server (default http://localhost:5173)
pnpm test         # Vitest (logic-bearing code)
pnpm test:e2e     # Playwright (PWA install, offline, critical flows)
pnpm check        # Biome lint + format check + strict typecheck
```

### Before Committing

```bash
pnpm check && CI=true pnpm test
```

## Testing Requirements

### Unit Testing (Vitest, logic-bearing code only)

-   Every logic-bearing module must have corresponding tests (stats engine,
    timers, persistence layer, game mechanics, unlock rules).
-   Use appropriate test setup/teardown mechanisms (fixtures,
    beforeEach/afterEach).
-   Mock external dependencies (e.g., fake timers for wall-clock logic,
    in-memory IndexedDB fake).
-   Test both success and failure cases (e.g., stat clamps, timer edge cases).

### Integration / E2E Testing (Playwright)

-   Test complete user flows: care action → stat change → face swap → star award
-   Verify offline flows: install PWA, go offline, reload, state persists
-   Verify IndexedDB transactions across reloads
-   Verify parent panel: mute persists, bedtime silences + dims
-   Touch interactions at 360px viewport

### Mobile Testing

-   Baseline viewport 360px portrait (per `product-guidelines.md`)
-   Use device emulation + touch interactions
-   Test on a real phone when possible (the son's playtest device)
-   Verify responsive layouts up to desktop
-   Check performance on mid-range devices (60fps care UI, no jank)

## Code Review Process

### Self-Review Checklist

Before requesting review:

1.  **Functionality**

    -   Feature works as specified
    -   Edge cases handled
    -   No failure language in UI ("wrong!", "you lost") per guidelines

2.  **Code Quality**

    -   Follows style guide
    -   DRY principle applied
    -   Clear variable/function names
    -   Appropriate comments

3.  **Testing**

    -   Logic code: Vitest tests written first, comprehensive, coverage adequate
    -   Presentational code: Playwright/manual verification plan noted
    -   E2E critical flows pass

4.  **Security**

    -   No hardcoded secrets
    -   No network calls (offline-first — any fetch is a red flag)
    -   No eval / dynamic code execution
    -   Zero analytics SDKs

5.  **Performance**

    -   Asset payload minimal (WebP/strips, precached sensibly)
    -   Images optimized
    -   60fps care UI on mid-range phones

6.  **Child Experience**

    -   Touch targets adequate (48x48px minimum)
    -   Text never required to play
    -   Feedback within 300ms of every tap
    -   Interactions feel native

## Commit Guidelines

### Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

-   `feat`: New feature
-   `fix`: Bug fix
-   `docs`: Documentation only
-   `style`: Formatting, missing semicolons, etc.
-   `refactor`: Code change that neither fixes a bug nor adds a feature
-   `test`: Adding missing tests
-   `chore`: Maintenance tasks
-   `conductor`: Conductor scaffolding/plan updates

### Examples

```bash
git commit -m "feat(care): Add hunger stat decay over wall-clock time"
git commit -m "fix(pwa): Precache run strip so runner works offline"
git commit -m "test(stats): Add clamping tests for kindness timers"
git commit -m "style(care): Improve button touch targets to 48px"
```

## Definition of Done

A task is complete when:

1.  All code implemented to specification
2.  Logic code: tests written first and passing; presentational code:
    Playwright/manual verification done
3.  Coverage meets project requirements (>80% on touched logic modules)
4.  Documentation complete (if applicable)
5.  Code passes Biome + strict typecheck
6.  Works beautifully on mobile 360px portrait (if user-facing)
7.  Implementation notes added to `plan.md`
8.  Changes committed with proper message
9.  Git note with task summary attached to the commit

## Emergency Procedures

### Critical Bug in Production

1.  Write failing test for bug (logic) or Playwright repro (presentational)
2.  Implement minimal fix
3.  Test thoroughly including mobile 360px
4.  Deploy (static PWA redeploy)
5.  Document in plan.md

### Data Loss (local save)

1.  Stop all write operations
2.  Restore from latest backup/export if available
3.  Verify data integrity
4.  Document incident
5.  Add save-migration guards to prevent recurrence

### Security Breach

1.  Rotate all secrets immediately
2.  Review access logs
3.  Patch vulnerability
4.  Notify affected users (if any)
5.  Document and update security procedures

## Deployment Workflow

Static PWA (no backend):

### Pre-Deployment Checklist

-   [ ] All tests passing
-   [ ] Coverage >80% on logic modules
-   [ ] No Biome/typecheck errors
-   [ ] Mobile 360px testing complete
-   [ ] PWA install + offline reload verified
-   [ ] No analytics/network calls introduced

### Deployment Steps

1.  Build (`pnpm build`) and preview the production bundle
2.  Deploy static `dist/` to host
3.  Verify install prompt + offline mode on a real phone
4.  Test critical paths (care loop, one mini-game, bedtime)
5.  Monitor for user feedback (son playtest)

## Continuous Improvement

-   Review workflow when pain points appear
-   Document lessons learned
-   Optimize for user happiness (small players + parents)
-   Keep things simple and maintainable
