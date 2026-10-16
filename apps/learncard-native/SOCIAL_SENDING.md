# Sending within a learner-first app

October 16, 2026. The learner pivot made creation/sending too hard to find. The user clarified that receiving and managing learning should lead, while sending remains a normal part of relationships and recognition. Institution workspaces remain a separate later product scope.

## Entry points

| Place                               | Action                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header **+ Add** on every main pane | **Add or send** shows Create new, Send existing creation and Share credentials directly, alongside receiving/file routes. No second tools screen. |
| Home                                | Create a credential and Your creations remain visible secondary rows below the learner content; no collapsed disclosure.                          |
| People → connected profile          | **Send a credential** opens reusable creations for that person, with a Create a credential action even when the list is empty.                    |

The Add chooser gives the actions room by dropping its large decorative hero. Its existing scan/link/photo/file routes and permission behavior remain. The small drawn title accents, illustrated rows and neutral canvas preserve the current visual language. No novelty prompts, sending streaks or administrative dashboard are introduced.

## Recipient and completion handoff

People uses the currently loaded connected profile's ID/name. New authoring initializes its recipient to that person and selects Someone else; the user still reviews Design → Recipient → Review and can change the recipient or choose self. Existing-creation sending initializes the username. Live delivery still requires the existing explicit Review Recipient lookup before the final send button becomes available. The backend continues to validate recipient/write permissions through the existing commands.

Creating/sending uses the existing credential service, request identity and error feedback. No write occurs on navigation, selection, review, back or cancellation. The parent picker closes after a successful child operation has dismissed, allowing the existing completion notice to appear. Cancelling returns to the picker with the selected connection retained; creations refresh after returning. No new network mutation or authorization contract is added.

Connections, request acceptance and data-sharing permission remain separate decisions. The contextual send action appears for connected profiles. Personal achievement sharing, contact invitation QR and organization tools remain later refinements.

## Validation

Focused localization, navigation and synthetic delivery checks are recorded in [TESTING](TESTING.md). Real staging delivery remains a separate manual check.

## Actual native examples

These are production SwiftUI screens running with synthetic demo people/credentials, not generated mockups or real account data.

- [Add or send, with direct creation/send actions](design/social-send-add.png)
- [Connected profile with Send a credential](design/social-send-profile.png)
- [No existing creations: Create remains available for the selected person](design/social-send-picker.png)
- [Explicit new-credential review retains Jordan Lee](design/social-send-review.png)
- [Arabic accessibility stress layout with direct Create/Send actions](design/social-send-add-arabic-accessibility.png) — deliberately enlarged; the standard Arabic layout is in the final test attachments.
