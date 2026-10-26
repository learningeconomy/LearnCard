# Contacts & connections

A learner finds another person by handle, sends a connection request, the other person accepts it from Alerts, and both see each other in Contacts.

## Sub-features

- `contacts-search`: Contacts → **Search** by handle → exactly one result `@handle` with **Request Connection**.
- `contacts-request`: **Request Connection** → the alert dialog `Are you sure you want to send a connection request?` → **Confirm**.
- `contacts-accept`: the other person, from `/notifications`, chooses **Accept**, and the notification reads **Accepted**.
- `contacts-mutual`: after a reload, each side's Contacts shows **1 Contacts** listing the other's `@handle`, and `getConnections()` agrees.

## How to get to it (user POV)

- Sidebar **Contacts** (`/contacts`) → **Search** textbox.
- Bell icon (**Alerts**) → `/notifications`.

## Driving it with lc verify

Preconditions:

- Doctor ok. Both actors have network profiles (`signInAs` creates them).

- **Run.** `$LCV run contacts --dir /tmp/lcv` → `contacts: passed`.
- **Search.** `getByRole('link', { name: 'Contacts' })` → `getByRole('textbox', { name: 'Search' })` fills the handle, and `getByRole('listitem').filter({ hasText: '@handle' })` has count 1.
- **Request.** The item's **Request Connection** → `getByRole('alertdialog', { name: 'Are you sure you want to send a connection request?' })` → **Confirm**; the dialog closes.
- **Accept.** In the other session, `/notifications` → `getByRole('button', { name: /^accept$/i })` → `Accepted`.
- **Mutual.** Both sides: `/contacts`, reload, **1 Contacts**, open it, and `@counterpart` is visible. `sdk(learner).invoke.getConnections()` includes the counterpart.

## Gotchas

- The connections count button's name is literally `1 Contacts` (no singular form).
- People search finds only profiles on this stack; fresh handles never collide.
- Invite links and QR connect (`/connect/:profileId`, **Invite a Friend**, **Show QR Code**) aren't covered here.
