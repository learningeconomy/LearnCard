# Overview

#### 🎟 Relevant Jira Issues

<!--- Example: Fixes: WE-53, Related to: WE-308 -->

#### 📚 What is the context and goal of this PR?

#### 🥴 TL; RL:

#### 💡 Feature Breakdown (screenshots & videos encouraged!)

#### 🛠 Important tradeoffs made:

#### 🔍 Types of Changes

<!--- What types of changes does your code introduce? Put an `x` in all the boxes that apply: -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Chore (refactor, documentation update, etc)

#### 💳 Does This Create Any New Technical Debt? ( If yes, please describe and [add JIRA TODOs](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2) )

- [ ] No
- [ ] Yes

# Testing

## Proof

<!-- proof:start -->
<!-- proof:end -->

Generate with `bun scripts/proof.ts publish --pr <n> --from-run <run dir> --update-pr`.
Media is optional locally; LearnCard Verification CI attaches it when the PR is ready for review (drafts are skipped).

#### 🔬 How Can Someone QA This?

<!--- Please add QA steps someone can follow in order to verify this works. -->

#### 📱 🖥 Which devices would you like help testing on?

<!-- iOS Simulator / Android Simulator / iOS Native / Android Native / Chromium / Safari / Firefox / Opera / Brave / Edge / Tablet  -->

#### 🧪 Code Coverage

<!-- What kind of tests did you or did you not write and why (unit, functional, integration, e2e)?-->

# Documentation

<!--
Quick guide: What docs does your change need?
- New API/feature → Tutorial or How-To in docs/
- Complex flow/architecture → Mermaid diagram
- Internal patterns for AI/devs → AGENTS.md
- App UI/UX changes → docs/apps/ (LearnCard App, ScoutPass)
-->

#### 📝 Documentation Checklist

<!-- Check all that apply. If none, explain why in the notes below. -->

**User-Facing Docs** (`docs/` → [docs.learncard.com](https://docs.learncard.com))

- [ ] **Tutorial** — New capability that users need to learn (`docs/tutorials/`)
- [ ] **How-To Guide** — New workflow or integration (`docs/how-to-guides/`)
- [ ] **Reference** — New/changed API, config, or SDK method (`docs/sdks/`)
- [ ] **Concept** — New mental model or architecture explanation (`docs/core-concepts/`)
- [ ] **App Flows** — Changes to LearnCard App or ScoutPass user flows (`docs/apps/`)

**Internal/AI Docs**

- [ ] **AGENTS.md** — New pattern, flow, or context that AI assistants need
- [ ] **Code comments/JSDoc** — Complex logic that needs inline explanation

**Visual Documentation**

- [ ] **Mermaid diagram** — Complex flow, state machine, or architecture

<!-- Add diagrams inline in docs or in a dedicated section.-->

#### 💭 Documentation Notes

<!-- If no docs needed, briefly explain why (e.g., "Internal refactor, no API changes") -->

# ✅ PR Checklist

- [ ] Related to a Jira issue ([create one if not](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2))
- [ ] My code follows **style guidelines** (eslint / prettier)
- [ ] I have **manually tested** common end-2-end cases
- [ ] I have **reviewed** my code
- [ ] I have **commented** my code, particularly where ambiguous
- [ ] New and existing **unit tests pass** locally with my changes
- [ ] I have completed the **Documentation Checklist** above (or explained why N/A)
- [ ] I have considered **product analytics** for user-facing features (use `@analytics` in learn-card-app)

### 🚀 Ready to squash-and-merge?:

- [ ] Code is backwards compatible
- [ ] There is **not** a "Do Not Merge" label on this PR
- [ ] I have thoughtfully considered the security implications of this change.
- [ ] This change does not expose new public facing endpoints that do not have authentication
