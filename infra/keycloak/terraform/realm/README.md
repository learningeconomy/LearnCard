# Realm as code

This root is the staging/production authority. `../modules/realm` ports the behavior
of `../../realms/learncard-dev-realm.json`; it never imports that fixture. The local
root uses the same module, then reads only dev users and `ci-tests` from the fixture.
Existing fixture-based compose and CI remain unchanged.

Terraform **>= 1.10** (runner **1.15.8**), AWS **~> 6.0** (lock **6.66.0**),
Keycloak-org provider **5.9.0**, pinned exactly in root/module/local. Verified against
[v5.9.0](https://github.com/keycloak/terraform-provider-keycloak/releases/tag/v5.9.0),
the latest 5.x release when implemented; its acceptance matrix includes 26.7.0,
and local apply is tested on server **26.7.4**. Lockfiles cover linux_amd64,
linux_arm64, darwin_arm64. Resource arguments were checked against the versioned
[provider docs](https://github.com/keycloak/terraform-provider-keycloak/tree/v5.9.0/docs).

## Behavior and deliberate environment differences

- Public `learncard-app`: authorization code + S256 PKCE only, no implicit flow,
  password grant or service account. `lca-api`: confidential service account,
  no interactive or password grant. No deployment test users or `ci-tests`.
- Built-in profile/email/roles/web-origins/basic scopes and optional phone scope;
  both phone attributes are admin-editable only and mapped into tokens/userinfo.
  Unmanaged profile attributes remain disabled. Keycloak 5.9's profile resource
  translates its default DISABLED to the server's absent-value representation.
- Hidden ticket broker `lca-api` trusts email; social Google/Apple **do not**.
  Broker and service-client secrets are distinct. Apple provider ID is `apple`,
  from the installed klausbetz jar, configured through the social resource's
  documented `provider_id` override and `teamId`/`keyId` extra config.
- Explicitly copied first-broker tree (provider has no copy resource): Review
  Profile configured `off`, unique user creation, collision confirmation and
  verification/reauthentication, conditional 2FA/organization branches unchanged.
  Stock flows remain untouched. All three IdPs bind to this managed copy.
- Fixture has no required-action overrides: preserve Keycloak's built-in actions,
  none newly defaulted. No automatic email linking or relaxed collision checks.
- Brute-force detection enabled; fixture's implicit server lifetimes made explicit:
  access token 5m, code 1m, login 30m, user action 5m, SSO idle 30m / maximum 10h,
  offline idle 30 days / maximum 60 days (maximum enforcement disabled).
- Deployment requirements beyond fixture: SSL `all` (local `none`), login/admin
  events enabled with 30-day retention, logging listener enabled; admin event
  request details disabled to avoid retaining sensitive payloads.

## Generate tenant inputs

From `apps/learn-card-app`:

```bash
bun run lc keycloak realm-inputs keycloak-staging
bun run lc keycloak realm-inputs keycloak-staging --check
bun test scripts/keycloak-realm-inputs.test.ts
bun run lc validate
```

AWS environment **staging maps to tenant stage keycloak-staging**. Pass both
`environments/staging.tfvars` and `generated/keycloak-staging.tfvars.json` explicitly.
Production maps to `production`; there is intentionally no generated production
file yet, and the runner fails closed until one is reviewed and committed.

Generator uses defaults → tenant config.json → config.<stage>.json (production
means base only), selects Keycloak tenants, groups by server URL/realm, unions
redirects/origins and rejects conflicting social IDs/issuers or the same realm name
on different servers. One root manages one service URL, checked against SSM.
Missing overlays use base configs; malformed JSON is fatal. `--check` compares
JSON data, tolerating only formatting changes from pre-commit Prettier.

Web callbacks/logout URLs use the configured domain; native callback is
`<bundleId>://login`. `capacitor://localhost` and `https://localhost` are intentional
**production WebView CORS origins**, not development browser redirects. No localhost
redirects are generated for staging. Staging bridge is
`https://staging.learncard.ai/auth/continue.html`, from config.staging.json's domain;
verify that static asset is deployed before native rollout.

Optional `auth.keycloak.googleClientId` / `appleClientId` (schema passthrough)
explicitly select web IdP IDs. Google otherwise uses the single Android web OAuth
ID from existing Firebase assets. Apple **never** uses a bundle ID as a web
Services ID. Unknown web IDs are emitted as `null`, requiring `client_id` in the
deployment secret. Once known, put public IDs in tenant config and regenerate.
Native audience lists are separately emitted in each realm entry for lca-api:

- `KEYCLOAK_ISSUERS`: each `server_url` + `/realms/<realm>`.
- `KEYCLOAK_AUDIENCES`: `learncard-app` only (never `ci-tests` outside local).
- `GOOGLE_OAUTH_CLIENT_IDS` / `APPLE_OAUTH_CLIENT_IDS`: union the generated native
  audience arrays; use `lc auth-audiences ...` to inspect them.
- `OIDC_ISSUER`: generated `lca_api_issuer_url`; `OIDC_CLIENT_ID=keycloak-broker`;
  `OIDC_CLIENT_SECRET`: same broker secret below.

Wiring those env vars into the services deployment is a follow-up; generating
this file does not deploy lca-api or authorize user cutover.

## Secret contract

Create in the environment account/region using AWS-managed Secrets Manager KMS
encryption (`alias/aws/secretsmanager`). Never put values in CLI arguments, tfvars,
git, logs or artifacts. All values read by this root **enter protected state**.
S3 state is encrypted, access-restricted and versioned; old secret values persist
in historical versions. Do not upload plans/state as CI artifacts.

Prefix: `learncard-keycloak/<env>/` (for staging, realm is `learncard`).

| Suffix            | SecretString shape                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap-admin` | Plain password string for temporary master user `admin`, not JSON                                                          |
| `terraform-realm` | Plain master confidential-client secret, not JSON; human creates container, bootstrap script fills it                      |
| `<realm>/google`  | `{"client_secret":"…","client_id":"…"}`; ID needed only if generated ID is null                                            |
| `<realm>/apple`   | `{"client_id":"<web Services ID>","team_id":"…","key_id":"…","private_key":"<raw p8 PEM>"}`; preserve PEM newlines in JSON |
| `<realm>/lca-api` | `{"client_secret":"<lca-api service client>","broker_client_secret":"<lca-api OIDC broker>"}`                              |

`<realm>/google` and `<realm>/apple` are read only for providers listed in the
environment's `social_providers` (default `["google", "apple"]`; staging starts with `[]`).
To enable one: create its secret, add it to `social_providers`, and re-apply.

Google and Apple OAuth consoles must permit
`https://<public-auth-host>/realms/<realm>/broker/google/endpoint` and
`https://<public-auth-host>/realms/<realm>/broker/apple/endpoint`, respectively.

## First apply and automation bootstrap (human-run, private connectivity)

1. Create the realm secrets and the empty `terraform-realm` secret container.
   Keep the existing plain-string bootstrap secret; ECS still references it.
2. Apply the service root update so CodeBuild picks up the new inline buildspec.
   No new runner permissions or bootstrap IAM boundary changes are needed: it
   already reads environment secrets and service SSM, and writes only realm state.
3. Start a build at a **reviewed commit SHA** with a PLAINTEXT override
   `TF_VAR_bootstrap_admin=true`. This selects `admin-cli` password grant using
   `bootstrap-admin`. Default without the override is client credentials.
4. From an authorized human AWS session with private admin connectivity run:

    ```bash
    # Human only; creates no secret values in shell history. Set AWS_REGION.
    aws secretsmanager create-secret --name learncard-keycloak/staging/terraform-realm
    bun infra/keycloak/scripts/bootstrap-realm.ts staging learncard
    ```

    If the container already exists, skip create-secret. The script reads SSM
    `/learncard-keycloak/<env>/service/admin_api_url` and the bootstrap password,
    creates/reuses `terraform-realm`, grants `create-realm` plus view/manage realm,
    clients, events and manage-identity-providers on each **application** realm's
    master `<realm>-realm` client, then writes its secret through stdin. It never
    grants master `admin`, user management, or access to other existing realms.
    Creating future realms requires `create-realm`; Keycloak grants the creator
    management of those realms. Re-run with additional existing realms to grant
    their scoped roles. Script is resumable after a secret-store failure and does
    not rotate an existing secret. It does not remove previously granted roles.
    For the documented human tunnel, override `KEYCLOAK_ADMIN_URL` to its HTTPS
    forwarded URL; do not disable TLS verification.

5. Run the root with `bootstrap_admin=false` (the default) and confirm no changes.
   Only then **manually delete temporary master user `admin`** in the private
   admin console. Do not delete the bootstrap secret: ECS startup still requires
   the referenced secret. Removing that startup dependency is separate work.

Backend initialization inside the VPC (no AWS apply was run during development):

```bash
terraform init -reconfigure \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=keycloak/$DEPLOY_ENVIRONMENT/realm.tfstate" \
  -backend-config="region=$AWS_REGION"
terraform apply -var-file=environments/staging.tfvars \
  -var-file=generated/keycloak-staging.tfvars.json
```

Backend is partial S3, encryption and `use_lockfile=true`. Default workspace only.
Provider uses the **SSM machine URL on 443**, not `KEYCLOAK_URL` or the console URL
on 8443. Check the backend account/key independently of the provider account guard.
Only trusted reviewed source may run in CodeBuild; a source override has realm-admin
authority. Routine drift inspection uses the same var files with
`terraform plan -detailed-exitcode`; scheduled credentialed orchestration belongs
to the pipeline workstream, not this root.

## Local parity and hostname proof

`local/` must only target a disposable Keycloak with Apple jar, no fixture import.
Build `infra/keycloak/Dockerfile.dev`, start on 8081 with admin/admin,
`--hostname=http://localhost:8081`, and host.docker.internal host-gateway on Linux.
Run `terraform init -backend=false`, `terraform apply`, then
`terraform plan -detailed-exitcode` there. Dev overlay owns only users and ci-tests.
Start Redis on **6381**, Mongo on 27017 and lca-api on 5100 with **CI=true** (avoids
requiring the unrelated Metabase secret), plus the env in the new workflow job.
Run the [live proof commands](../../README.md#firebase-era-mapping-migration-ad-10).

Hostname spike, 2026-09-25: stock `quay.io/keycloak/keycloak:26.7.4`, production
`start --db=dev-file --hostname=https://auth.staging.learncard.app
--hostname-admin=https://admin.auth.staging.learncard.app:8443
--http-enabled=true --proxy-headers=xforwarded`. Local port 18081 forwarded to 8080. Requests used Host/X-Forwarded-Host `admin.auth.staging.learncard.app`,
X-Forwarded-Proto `https`, X-Forwarded-Port `443`, simulating internal ALB TLS
termination without changing /etc/hosts. Password grant returned **200** with
public-host issuer; admin realms GET returned **200**. Terraform 5.9.0 provider
with those `additional_headers` successfully created `hostname-proof`; follow-up
plan had **no changes**. Thus **no KC_HOSTNAME_BACKCHANNEL_DYNAMIC or ecs.tf
change is necessary**. This proves server/provider behavior, not live VPC/TLS routing.

Local verification on 2026-09-25:

- Module + overlay: 43 resources created; second plan no changes after accounting
  for Keycloak's automatic `introspection.token.claim=true` default.
- Broker round-trip/migration specs: **6 passed, 0 failed**. Mapping-presence FAIL
  during the negative control is expected coverage output, not a test failure.
- OIDC/token-verifier live specs: **8 passed, 0 failed**.
- Generator: **7 passed, 0 failed**; committed-input check and tenant validation passed.
- Bootstrap helper tested against local Keycloak only; scoped client-credentials
  plan of `module.realm` had no changes. Dev user overlay intentionally excluded
  because the automation identity has no user-management rights.
- Offline init/validate/TFLint passed in realm, local, service, network and AWS
  bootstrap roots. Recursive formatting check and auth workflow actionlint passed.
- No AWS calls, AWS plans/applies, pushes or stash changes were performed.
