# AI session app pickers

When a learner starts a new AI session, the app asks which AI app to use. LearnCard AI is the only supported app; the ChatGPT, Claude and Gemini session apps are retired and must not be offered in either picker.

## Sub-features

- `ai-new-topic-app-picker`: AI Sessions → new session → type a topic → "What app do you want to use?" offers exactly one app, LearnCard AI.
- `ai-app-selector`: the "Which AI Learning App do you want to use?" selector (shown to learners who have not consented to an AI app) lists exactly one app with a Get/Open action, LearnCard AI.
- `ai-app-selector-reload`: the selector still lists only LearnCard AI after a reload.

## How to get to it (user POV)

- Open **AI Sessions** (`/ai/topics`), choose the new-session icon next to the **Sessions** count, type a topic and send it.
- Learners with no AI app consent reach the selector from the new-session entry points; `/ai/topics?shortCircuitStep=aiAppSelector` opens it directly.

## Driving it with lc verify

Preconditions:

- Doctor ok. Off production, `getSelectableAiPassportApps` already limits the "What app" picker to LearnCard AI, so `ai-app-selector` is the entry that would show any other catalog app locally.

- **Run.** `$LCV run ai-sessions --dir /tmp/lcv` → `ai-sessions: passed`.
- **New topic.** On `/ai/topics`, click the button following `getByRole('button', { name: /^\d+ Sessions?$/ })`. Fill the visible `getByPlaceholder('Something else...')` and press Enter. "What app do you want to use?" shows exactly one `getByRole('button', { name: /logo/ })`, named LearnCard AI.
- **Selector.** Open `/ai/topics?shortCircuitStep=aiAppSelector`. Exactly one `getByRole('button', { name: /^(Get|Open)$/ })`; `LearnCard AI` visible; no `ChatGPT`, `Claude` or `Gemini` text.
- **Persistence.** Reload; the selector shows the same single app.

## Gotchas

- Never click the LearnCard AI tile. It consents to a contract that does not exist on the local network and starts a session that needs the ai-agent service.
- The new-session icon button has no accessible name; the journey locates it relative to the Sessions count. Give it a name in the product and update the locator together.
- Desktop renders the topic input twice; drive the visible one.
- Keep the selector navigation after the new-topic step in the same browser context. This checks that the explicit URL selection overrides the persisted previous step when the modal opens; a fresh profile alone misses that regression.
- App logos load from the Filestack CDN, which the network policy blocks, so tiles may render without images. Assert by text and accessible name, not image source.
- The production branch of the "What app" picker, which shows other apps the learner has consented to, cannot run here. `aiPassport-apps.helpers.test.ts` asserts the catalog holds LearnCard AI alone.
