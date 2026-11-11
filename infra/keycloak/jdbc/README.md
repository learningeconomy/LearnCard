# Keycloak JDBC runtime

Production uses `software.amazon.jdbc:aws-advanced-jdbc-wrapper:4.4.0` (the latest
stable upstream release checked on 2026-09-25). The existing Keycloak PostgreSQL
driver remains the underlying driver; do not install another PostgreSQL jar.

## Reproducibility and dependencies

`pom.xml` pins the wrapper, the AWS SDK BOM **2.46.10** (the wrapper's tested SDK),
and Jackson Databind **3.2.2**. The Docker build resolves the runtime graph using
`maven-dependency-plugin:3.8.1` with `--strict-checksums`: missing or mismatched
repository checksums fail the build. Maven itself is pinned to
`maven:3.9.11-eclipse-temurin-21@sha256:6fdc855a6ed81d288ca7ca37ac6ff5e9308b612485c0801d70b25a858c83d237`.
There are no floating dependency versions or snapshots. This verifies Maven
Central's published checksums, not an independently maintained artifact hash lock.
Only resolved jars are copied into `/opt/keycloak/providers/` before `kc.sh build`;
the Maven JDK/tooling does not enter the runtime image. The Apple provider keeps its
existing independent SHA-256 `ADD` pin.

Secrets Manager is a synchronous client. Exclude Apache, Apache5 and Netty
transports; use **url-connection-client** only. STS supports the default credential
chain's optional web-identity/assume-role providers (Fargate itself uses container
credentials). No RDS, KMS, SSO, federated-auth or telemetry SDK module is required
for the selected plugins. The multi-release wrapper uses **Jackson 3 on Java 17+**;
Keycloak's Jackson 2 alone is insufficient.

Resolved inventory (35 new jars; Apple 1.17.0 unchanged):

| Group / version                      | Artifacts                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `software.amazon.jdbc`, 4.4.0        | `aws-advanced-jdbc-wrapper`                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `software.amazon.awssdk`, 2.46.10    | `annotations`, `auth`, `aws-core`, `aws-json-protocol`, `aws-query-protocol`, `checksums`, `checksums-spi`, `endpoints-spi`, `http-auth`, `http-auth-aws`, `http-auth-aws-eventstream`, `http-auth-spi`, `http-client-spi`, `identity-spi`, `json-utils`, `metrics-spi`, `profiles`, `protocol-core`, `regions`, `retries`, `retries-spi`, `sdk-core`, `secretsmanager`, `sts`, `third-party-jackson-core`, `url-connection-client`, `utils`, `utils-lite` |
| `software.amazon.eventstream`, 1.0.1 | `eventstream`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tools.jackson.core`, 3.2.2          | `jackson-core`, `jackson-databind`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `com.fasterxml.jackson.core`, 2.22   | `jackson-annotations`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `org.reactivestreams`, 1.0.4         | `reactive-streams`                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `org.slf4j`, 1.7.36                  | `slf4j-api`                                                                                                                                                                                                                                                                                                                                                                                                                                                |

When upgrading, review both upstream plugin docs and the resolved graph; rebuild
and repeat the class-load test, not just the image build. Do not replace this with
the federated-auth bundle, which installs unrelated capabilities.

## Local verification — 2026-09-25

No AWS API calls were made. Images built and loaded with:

```bash
docker buildx build --builder desktop-linux --platform linux/arm64 \
  -f infra/keycloak/Dockerfile infra/keycloak --load -t kc-jdbc:rotation
docker run --rm --network none kc-jdbc:rotation show-config
docker buildx build --builder desktop-linux --platform linux/arm64 \
  -f infra/keycloak/Dockerfile.dev infra/keycloak --load -t kc-jdbc:dev
```

- `show-config`: `kc.db-driver = software.amazon.jdbc.Driver (Persisted)` and
  `kc.features-disabled = twitter-broker,identity-brokering-api (Persisted)`.
- Image size (`docker image inspect .Size`): baseline **762,208,662 bytes**, new
  **780,805,532 bytes**; delta **18,596,870 bytes (17.74 MiB, 2.44%)**. Baseline was
  built from the original Dockerfile, matching staging manifest `47c8bc814426…`.
- PostgreSQL 17 on an isolated internal Docker network, generated one-day server
  certificate, server SSL enabled. JDBC URL used `sslmode=require` and
  `wrapperPlugins=failover2,efm2`, explicit development DB username/password.
  `start --optimized --hostname=http://localhost:18082 --http-enabled=true
--proxy-headers=xforwarded --cache=local`: production startup **2.779s**, schema
  **100 tables**, DB sessions **TLSv1.3**, port 9000 `/health/ready` HTTP **200/UP**
  after asynchronous bootstrap completed. Health was read using Bash `/dev/tcp`
  inside the container (internal-network host port publication is unavailable).
- A separate production instance with `--cache=ispn --cache-stack=jdbc-ping`
  logged `JGroups JDBC_PING discovery enabled`, formed a one-member cluster view,
  and returned HTTP **200/UP**, including cluster health. This proves the wrapped
  datasource works for discovery; it is not an Aurora multi-node failover test.
- Secrets Manager class-load proof: `docker run --rm --network none`, no mounted
  credentials, `AWS_EC2_METADATA_DISABLED=true`, URL with `wrapperPlugins=awsSecretsManager`,
  `secretsManagerSecretId=dummy`, `secretsManagerRegion=us-east-1`, `sslmode=require`,
  no DB username/password. It failed with **`SdkClientException: Unable to load
credentials from any of the providers in the chain`**, through
  `AwsSecretsManagerConnectionPlugin.fetchLatestCredentials` and
  `DefaultSecretsManagerClient.getSecretValue`, not `ClassNotFoundException` or
  `NoClassDefFoundError`. Network isolation guaranteed no AWS request.
- Dev image, admin/admin on port 18083: local realm root `apply -auto-approve
-var keycloak_url=http://localhost:18083 -state=<temporary path>` created **43**
  resources. Subsequent `plan -detailed-exitcode` returned **0 / No changes**.
  Admin API confirmed enabled `google/google`, `apple/apple`, `lca-api/oidc`.
  Following only local authorization redirects with session cookies yielded
  **303** to `accounts.google.com`, `appleid.apple.com`, and `localhost:5100`.
  Legacy `/broker/google/token` returned **400**, `Identity Brokering API feature
not enabled`. No external IdP requests or real sign-in credentials were used;
  complete external callback flows remain integration/staging tests.
- `terraform fmt -check -recursive infra`, service/bootstrap `init -backend=false`,
  `validate`, `tflint --init && tflint`, actionlint for both touched workflows,
  shellcheck for all existing Keycloak shell scripts: **passed**. LSP diagnostics
  for `ecs.tf`, `rds.tf`, `variables.tf`: **clean**.

See the [service rotation runbook](../terraform/service/README.md#database-credentials-and-rotation)
for the mandatory live rollout/drill. Local tests do not establish real task-role
authorization, secret rotation recovery, Aurora topology/failover, or production readiness.

## References

- [Keycloak 26.7.4 Aurora guide](https://github.com/keycloak/keycloak/blob/26.7.4/docs/guides/server/db.adoc#preparing-for-amazon-aurora-postgresql)
- [Wrapper 4.4.0 release](https://github.com/aws/aws-advanced-jdbc-wrapper/releases/tag/4.4.0)
- [Secrets Manager plugin and rotation behavior](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/4.4.0/docs/using-the-jdbc-driver/using-plugins/UsingTheAwsSecretsManagerPlugin.md)
- [Keycloak feature names/disable rules](https://github.com/keycloak/keycloak/blob/26.7.4/common/src/main/java/org/keycloak/common/Profile.java)
- [Broker feature checks guard token retrieval, not login/callbacks](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/services/resources/IdentityBrokerService.java)
