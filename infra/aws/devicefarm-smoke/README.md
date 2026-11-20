# Device Farm staging smoke

The LearnCard pilot runs every Monday, Wednesday, and Friday at 9:17 a.m. Eastern and on demand from `main` against staging. The release workflow has no dependency on this check. The defaults run Espresso on one physical Android device and XCUITest on one physical iPhone. The workflow reports test outcomes and temporary pool deletion per platform.

## Provisioning

1. In the pilot AWS account, confirm the GitHub Actions OIDC provider already exists and allows the `sts.amazonaws.com` audience. Deploy `role.yml` in `us-west-2` with the existing Device Farm pilot project ID. The stack needs `CAPABILITY_IAM`. The `RoleArn` output is the value of `DEVICEFARM_SMOKE_ROLE_ARN`.
2. In GitHub, create the `devicefarm-smoke-staging` environment and permit deployments from the `main` branch only. Set `DEVICEFARM_SMOKE_ROLE_ARN` and set `DEVICEFARM_PROJECT_ARN` if using a different project ID from the template default. Supply the existing development signing inputs used by the workflow, including the match access, Apple API key, and app and team variables. See the **Build XCUITest IPA and test runner** step for the full list.
3. Run **Native smoke (AWS Device Farm)** from **Actions** using `main`. Review the Android, iOS, and **Smoke summary** jobs. The summary reports the pool ARN and confirms deletion when Device Farm no longer finds that pool.

Scheduled runs and the default dispatch request a one-hour OIDC session. Jobs request six hours for repeated tests or when Android runs both frameworks in sequence, leaving time to delete the temporary device pool.

## Slack

The **Notify Slack** job uses the repository's `SLACK_BOT_TOKEN` and `DEVICEFARM_SMOKE_SLACK_CHANNEL_ID` repository variable. The bot needs `chat:write` and access to the configured channel. Set the variable after confirming the channel. A configured delivery reports its own outcome in Actions. Scheduled failures and every manual completion send a notification. The notification includes platform results and a link to the summary.

## Recovering an interrupted run

A runner can be stopped before it reaches its in-process cleanup. Use the job log to locate the scheduled run ARN and the temporary pool ARN. Pools created by the workflow are named `lc-smoke-<platform>-<github-run-id>-<attempt>`. In the pilot project, stop any still-active run for that dispatch and wait for it to finish before deleting its exact temporary pool. Confirm the pool is absent afterward.

A recovery job that can reconcile abandoned pools after timeout or cancellation is a follow-on. Keep recovery scoped to the exact run and pool, so it cannot remove a pool belonging to another dispatch.
