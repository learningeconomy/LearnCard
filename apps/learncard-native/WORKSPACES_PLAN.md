# Personal and institution workspaces — later proposal

October 16, 2026. The user wants to revisit this after learner Home/onboarding. This is a planning record, not an implemented native capability or authorization to import web administration into the learner app. The immediate design is [learner Home and first arrival](design/LEARNER_HOME_BRIEF.md).

## Product model

One signed-in person has **My LearnCard**, containing their personal Passport, and can explicitly enter named institution workspaces where they have real delegated access. A teacher may also be a learner and may work with several institutions. A self-selected Learner/Teacher/Admin persona is not sufficient authority and need not be a mutually exclusive identity.

| Personal workspace                              | Institution workspace proposal                        |
| ----------------------------------------------- | ----------------------------------------------------- |
| Home: incoming achievements and next actions    | Overview: tasks requiring attention                   |
| Passport: personal records and sharing          | Credentials: templates, drafts, issuance and delivery |
| Inbox: credentials, requests and updates for me | Activity: work performed for this institution         |
| Apps: consumer learning tools                   | Learners: permitted groups and people                 |

Within an institution workspace, a teacher could focus on assigned groups and issuance; an administrator could additionally manage staff, templates and reporting. Exact permissions, navigation and feature coverage remain to be designed/audited. Desktop can continue hosting CSV imports and complex reporting while mobile focuses on frequent quick tasks.

A clear workspace selector might offer My LearnCard, Northside School · Teacher, and Community Learning Centre · Administrator. Show the active institution throughout navigation and identify the issuer at confirmation. Personal learners need not see an empty switcher or staff tools. Receiving a school credential alone does not make someone a staff member or grant access to its workspace. Staff onboarding can follow an invitation/setup path separately from personal signup.

## Existing foundation

- `apps/learn-card-app/src/components/learncard/AccountSwitcherModal.tsx` enumerates available managed/service profiles and switches accounts.
- `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple.tsx` creates a manager-ID credential, a child ProfileManager and `createManagedProfile({ isServiceProfile: true })` for an organization.
- `packages/learn-card-base/src/hooks/useSwitchAccount.ts` calls `switchProfile(account.did)`, distinguishes service/child state and refreshes the active profile. `stores/walletStore.ts` stores the switched context.
- Brain's `models/ProfileManager.ts` and `routes/profile-manager.ts` connect managers, managed profiles and administering profiles through existing graph relationships.
- `DashboardRoleSwitcher.tsx` persists the presentation role, and `LaunchPadActionModal.RoleActions` varies shortcuts. This is different from the acting organizational profile and its real delegated access.

This foundation gives a place to integrate a workspace UI. It is not evidence of a complete classroom/roster, fine-grained staff authorization or individual-actor audit system.

## Scope and unanswered contracts

The named switcher, navigation, Home priorities and simple task entry points could largely reuse frontend/service boundaries. Audit existing behavior before introducing backend requirements. Class/group records, roster search/access, bulk operations, staff invitations, finer permissions, role revocation and recording the individual actor under an organization identity may need backend work.

Workspace switching must scope lists, drafts, requests, caches and signing context consistently. Preserve personal data and a clear route back. Late responses or queued actions from one context cannot populate or execute in another. Institution membership does not imply access to a learner's private Passport; use explicit supported sharing/consent flows.

Future investigation should map authority and audit behavior end to end, select one real educator task and design a thin workspace around it. Keep any stronger organization abstraction distinct from Families/guardian key custody. Do not turn profile switching or presentation roles into blanket authorization.

## Deferred adjacent ideas

Demo account login remains on hold. Resetting a shared writable account on sign-out would interfere with concurrent visitors. An isolated sample-data session or per-visitor sandbox is a later option, with an explicit boundary from real credential/account state. The user subsequently approved Native Lab Firebase registration and its Google iOS client is ready; live testing and Apple team/grouping checks remain deferred, and installed/committed provider controls stay disabled. Provider activation is not required for the learner design pass.
