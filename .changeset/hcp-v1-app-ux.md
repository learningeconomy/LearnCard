---
'learn-card-base': minor
'learn-card-app': minor
---

Add the HCP management screens behind the `enableHcp` LaunchDarkly flag (LC-2424). Dev builds always show them. From Privacy & data, "Apps that can see your info" opens three tabs:

- My info: add, edit and remove what apps may know, grouped by topic.
- Apps with access: who can see what, why, and until when, with Stop sharing.
- Activity: the log in plain sentences.

`/hcp/connect?client=…&name=…&categories=…&purpose=…` asks the person to allow an app read-only access.
