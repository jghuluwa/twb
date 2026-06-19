# AGENTS\.md

## OpenClaw Agent Guidelines \(Compact English Version\)

**Standard**: Karpathy’s 4 Core Coding Principles \+ Extended Engineering Rules \+ Creation Specifications \+ Next\.js Project Rules

This file defines all mandatory rules for OpenClaw agent coding, writing and project development behaviors\. All tasks must follow the rules strictly without exception\.

---

## 1\. Core Coding Principles \(Hard Rules\)

### 1\.1 Think Before Coding

Fully analyze requirements before writing code\. Eliminate guesswork and implicit assumptions\. Confirm all ambiguous points explicitly before implementation\.

### 1\.2 Simplicity First

Build minimal, functional code that meets current needs\. Strictly avoid over\-engineering, premature abstraction, redundant logic and future speculative features\.

### 1\.3 Surgical Changes

Perform only task\-related code modifications\. Never refactor, reformat or optimize unrelated code\. Fully preserve existing project style and structure\.

### 1\.4 Goal\-Driven Execution

Transform vague requirements into verifiable goals\. Iterate through implement\-verify\-fix cycles\. Split complex tasks into small, executable steps\.

---

## 1\.5 Extended Core Engineering Rules

- **Error First**: Pause iteration to diagnose all failures\. Resolve errors, warnings and abnormal states before continuing development\.

- **No Hallucination**: Never invent code, APIs, paths, data or project facts\. Verify all uncertain content against existing project files\.

- **Context Minimalism**: Load only task\-relevant files and code\. Avoid full codebase scans to prevent context pollution and hallucinations\.

- **Incremental Delivery**: Deliver small, testable and valid code updates\. Reject large\-scale one\-time rewrites\.

- **Repo Consistency**: Follow existing repository conventions strictly\. Project style always overrides personal coding habits\.

- **Exact Intent Alignment**: Implement only user\-specified requirements\. No unrequested features, optimizations or redundant polishing\.

- **Traceable Change**: Document non\-trivial modifications and key tradeoffs to ensure long\-term maintainability\.

- **Safety Priority**: Protect core configurations and sensitive files\. Avoid irreversible batch operations and breaking changes\.

---

## 2\. Session Initialization

Load and comply with all core workspace files at session start: **SOUL\.md, USER\.md, MEMORY\.md, daily memory logs**\.

---

## 3\. Permission Rules

### 3\.1 Auto\-Allowed

Allow file reading, code viewing, sandbox testing, documentation writing and comment editing without confirmation\.

### 3\.2 User Confirmation Required

Require explicit user confirmation for file operations, Git actions, dependency installation, system config changes and bulk code edits\.

### 3\.3 Strictly Forbidden

Prohibit privacy leakage, secret exposure, destructive commands, malicious code generation, result fabrication and rule bypassing\.

---

## 4\. Memory Management

Record key decisions and user preferences in daily logs\. Store critical project rules in MEMORY\.md\. Exclude all sensitive data and keep logs concise\.

---

## 5\. Standard Workflow

Follow fixed workflow: Clarify requirements → Confirm solution → Apply incremental changes → Verify correctness → Deliver complete results\.

---

## 6\. Multi\-Scenario Content Creation Rules

Mandatory unified rules for **we\-media, academic paper, popular science** and all non\-code writing tasks\. Zero exceptions\.

### 6\.1 General Creation Hard Rules

- **No Fabrication**: Use only verifiable facts, data, quotes and cases\. Strictly reject all fabricated content\.

- **Genuine Originality**: Avoid plagiarism and duplicate content\. Reorganize content with independent and original logic\.

- **Intent Alignment**: Adhere strictly to fixed theme, tone and audience positioning\. Eliminate off\-topic and redundant content\.

- **Logical Rigor**: Maintain coherent context and consistent viewpoints\. Remove ambiguous and contradictory statements\.

### 6\.2 We\-Media Content Specifications

- **Friendly Tone**: Use plain, fluent and accessible language\. Avoid rigid and obscure academic jargon\.

- **Focused Content**: Highlight core viewpoints only\. Remove verbose and invalid redundant content\.

- **Compliant Output**: Produce positive and standard content\. Reject extreme, misleading and sensitive statements\.

- **Clean Structure**: Optimize paragraph segmentation and sentence flow to enhance reading experience\.

### 6\.3 Academic Paper Specifications

- **Formal Standard**: Adopt rigorous academic tone and standardized terminology\. Follow official paper formatting norms\.

- **Solid Argumentation**: Provide complete reasoning and standardized citations for literature and experimental data\.

- **Clear Distinction**: Separate objective facts from subjective analysis\. Explicitly mark hypotheses and research limitations\.

- **Standard Expression**: Eliminate colloquial language, emotional wording and unsubstantiated conclusions\.

### 6\.4 Popular Science Specifications

- **Scientific Accuracy**: Preserve core professional principles\. Simplify expertise without distorting scientific facts\.

- **Plain Explanation**: Interpret professional terms in simple language\. Avoid obscure and hard\-to\-understand expressions\.

- **No Misleading Content**: Strictly follow scientific truths\. Reject false and incorrect popular science content\.

- **User Adaptation**: Match public cognitive level\. Deliver intuitive and practical professional knowledge\.

---

## 7\. Next\.js Project Development Rules

Mandatory guidelines for all agent interactive development on this Next\.js repository, ensuring stable HMR and consistent development environment\.

### 7\.1 Development Server Rule

- **Dev Mode Only**: Use `npm run dev`, `pnpm dev` or `yarn dev` for all iterative development to retain HMR functionality\.

- **Forbidden In\-Session Build**: Never run `npm run build` during agent sessions\. Production builds corrupt `\.next` assets and break HMR\.

- **Offline Build Only**: Perform production builds exclusively outside interactive agent development workflows\.

### 7\.2 Dependency Sync Rule

- **Sync Lockfile**: Update the corresponding lockfile after adding or upgrading project dependencies\.

- **Restart Dev Server**: Restart the development server immediately to apply dependency changes\.

### 7\.3 Project Coding Conventions

- **TypeScript First**: Create all new components and utilities with `\.ts` or `\.tsx` files\.

- **Style Co\-Location**: Store component\-specific styles within the component directory whenever possible\.

### 7\.4 Standard Project Commands

- **npm run dev**: Start HMR\-enabled development server \(primary allowed development command\)\.

- **npm run lint**: Execute ESLint code style and error inspection\.

- **npm run test**: Run project test suites if test configurations exist\.

- **npm run build**: Build production assets — strictly forbidden in agent sessions\.

---

**Final Mandatory Rule**: All listed rules are permanent and fully binding\. Resolve environment anomalies by restarting the dev server instead of executing production builds\.

> （注：文档部分内容可能由 AI 生成）



<!-- WEB-TOOLS-STRATEGY-START -->
### Web Tools Strategy (CRITICAL)

**Before using web_search/web_fetch/browser/opencli, you MUST `read workspace/skills/web-tools-guide/SKILL.md`!**

**Four tools, branch by scenario (NOT a hierarchy):**
```
web_search  -> No URL, need to search info         ─┐
web_fetch   -> Known URL, static content            ─┤ Primary (pick by scenario)
                                                     │
opencli     -> Either fails? CLI structured access  ─┤ Fallback (try before browser)
browser     -> All above fail? Full browser control ─┘ Last resort
```

**When web_search/web_fetch fail**: try `opencli` first (70+ sites, `opencli --help` to discover). Only escalate to `browser` when opencli also can't handle it.

**When web_search errors: You MUST read the skill's "web_search failure handling" section first, guide user to configure search API. Only fall back after user explicitly refuses.**
<!-- WEB-TOOLS-STRATEGY-END -->

---

## GitHub Repository Safety Policy

**Applies to**: `jghuluwa/twb` (https://github.com/jghuluwa/twb) and any future repositories under `jghuluwa`
**Local path**: `/root/repos/twb` on 111.229.169.185 (accessed via SSH)
**Auth**: `gh` CLI logged in as `jghuluwa` on 111.229.169.185

### Scope

- Only operate inside `/root/repos/twb` on 111.229.169.185.
- Do not modify files outside this directory on any server.

### Branch Rules

- Every code task **must** create a new branch with the `ai/` prefix (e.g. `ai/update-brand-slogan`, `ai/fix-header-overflow`).
- **Never** commit or push directly to `main`, `master`, or `release`.
- Before starting work, always run `git status --short`. If there are uncommitted changes not created by the current task, **stop** and report.
- Before creating a PR, rebase onto the latest `main` to avoid merge conflicts.

### Code Quality

- Before modifying code, read the repository's contributing guidelines (CONTRIBUTING.md, AGENTS.md) and existing tests.
- After modifying code, run all available lint, typecheck, test, and build commands.
- If any check fails, do not create the PR. Report the failure and proposed fix.

### Commit & PR Rules

- **Without explicit authorization from 黄总**, do not commit, push, create PRs, or merge PRs.
- PR titles follow the format: `feat: / fix: / docs: / refactor: / chore: `
- PR descriptions must include: changed files, test results, risks, and pending items.
- Delete the `ai/` branch after the PR is merged.

### Dangerous Operations — Absolutely Forbidden

- `git push --force` / `git push -f`
- `git reset --hard`
- `git clean -fd`
- Deleting remote branches
- Deleting files not related to the current task
- Modifying `.github/workflows/` without explicit approval

### Credential Safety (Iron Rule ⑭)

- Never output, commit, read, or transmit `.env` files, API keys, tokens, private keys, or production database credentials.
- GitHub PAT/token is never persisted in any file or memory log. Single-use only — read, authenticate, delete immediately.

### Incident Reporting

- If any unexpected git state is detected (detached HEAD, untracked changes from unknown source, force-push in history), **stop immediately** and report to 黄总 with full details.
