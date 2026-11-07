# CI service image pulls (LC-2312 / CI-11a)

GitHub starts `jobs.<job>.services` before checkout or workflow steps. The five
services below use the existing repository-level `DOCKERHUB_PULL_USERNAME` and
`DOCKERHUB_PULL_TOKEN` secrets in `services.<service>.credentials`, so registry
login happens before their images are pulled. A later `dockerhub-login` action
cannot authenticate these earlier pulls.

| Workflow               | Job                       | Service   | Image     |
| ---------------------- | ------------------------- | --------- | --------- |
| `auth-integration.yml` | `keycloak-verifier-tests` | `redis`   | `redis:7` |
| `auth-integration.yml` | `keycloak-verifier-tests` | `mongodb` | `mongo:7` |
| `auth-integration.yml` | `keycloak-realm-tests`    | `redis`   | `redis:7` |
| `auth-integration.yml` | `keycloak-realm-tests`    | `mongodb` | `mongo:7` |
| `test.yml`             | `ai-agent`                | `mongo`   | `mongo:7` |

For example, a Redis pull can fail before checkout even if a later workflow step
would successfully log in. Putting the credentials on the Redis service makes
that initial pull use the configured account. Image tags, ports, health checks,
application tests and Terraform settings are unchanged.

## Evidence and limits

The [October 9 verifier job](https://github.com/learningeconomy/LearnCard/actions/runs/37995186780/job/114039300794)
failed its initial `redis:7` pull with Docker Hub's unauthenticated pull quota
error. Its next two attempts timed out contacting the token endpoint; checkout
never ran. A [second realm job](https://github.com/learningeconomy/LearnCard/actions/runs/37994588731/job/114037254767)
also logged the quota error. These are observed historical failures, not an
inference from anonymous YAML alone.

Both jobs recorded this error during **Initialize containers** (quoted here so
the evidence remains useful after Actions logs expire):

```text
Error response from daemon: toomanyrequests: You have reached your unauthenticated pull rate limit.
```

GitHub's [current limits documentation](https://docs.github.com/en/actions/reference/limits#docker-hubs-rate-limit-for-github-actions)
says public Docker Hub pulls on GitHub-hosted runners are exempt from its pull
limit. The historical logs show that service initialization nevertheless failed
with that error. This change supplies the configured pull identity at the right
boundary; it does not establish that every anonymous hosted pull is limited, or
that authentication cures registry/token-endpoint outages.

The Docker-verified ECR Public mirror was considered. It has separate
[unauthenticated quotas](https://docs.aws.amazon.com/AmazonECR/latest/public/public-service-quotas.html),
and an anonymous Redis manifest probe returned `toomanyrequests: Rate exceeded`
during this investigation. No registry migration or service-version change is
part of this fix.

## Credentials and missing-secret behavior

Reuse only the existing **pull-only** credential contract; never supply a
push-capable token. No secret is added, read into a local agent session, rotated,
or copied to Infisical by this change. Runtime service secrets are unrelated.

The [runner's registry-login implementation](https://github.com/actions/runner/blob/main/src/Runner.Worker/ContainerOperationProvider.cs)
skips login when either credential is empty. Fork and Dependabot runs without
these secrets therefore keep anonymous public pulls. This fix does not promise
quota recovery for those runs. Do not expose secrets through `pull_request_target`
or widen permissions to change that behavior.

If both credentials are supplied but rejected, initialization fails after the
runner's login retries. Unlike the later best-effort CLI login action, a service
credential failure cannot fall back to anonymous pulls. Check credential validity
and coordinate any replacement with the existing secret owner. The runner uses a
temporary client config for service login/pull and removes it before workflow
steps; this is separate from the later CLI action's `DOCKER_CONFIG`.

## Troubleshooting failed initialization

- **Initialize containers** shows `unauthorized` or a failed `docker login`:
  check the existing pull account and token with the secret owner. Supplied but
  rejected credentials block service startup; updating a later CLI login step
  cannot recover that job. Do not paste credentials into logs or comments.
- A **Docker Hub login failed** warning from the composite action means that
  job's later CLI pulls continue anonymously. Service-container jobs using the
  same rejected credentials fail before their steps; coordinate token rotation.
- `toomanyrequests` matches the historical quota failure above. If no credentials
  are available, public pulls remain anonymous. Token-endpoint timeouts indicate
  a registry/network problem; authentication does not guarantee recovery.

## Verification

Inspect **Initialize containers** in both Auth Integration jobs and **AI Agent CI**:
expect a masked registry-login command before each pull, followed by the existing
service health checks. Later test failures must be assessed separately from
successful registry login, image pull and service readiness. Hosted runner results
are the integration proof; a local warm image or YAML parse is insufficient.

For changes here, run the pinned actionlint and strict YAML checks in
`.github/workflow-validation`. Review the parsed workflows to confirm only the
five service credential maps changed. No package version bump is needed.

Terraform realm creation concurrency is the separate **CI-11b** change. Docker
CLI/Testcontainers login steps and other registry/network retries retain their
existing behavior.
