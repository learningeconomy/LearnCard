# Resolve the complete runtime graph, verifying Maven Central checksums strictly.
# No Maven/JDK build tooling is copied into the runtime image.
FROM maven:3.9.11-eclipse-temurin-21@sha256:6fdc855a6ed81d288ca7ca37ac6ff5e9308b612485c0801d70b25a858c83d237 AS jdbc
WORKDIR /jdbc
COPY jdbc/pom.xml ./pom.xml
RUN mvn --batch-mode --no-transfer-progress --strict-checksums \
    org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy-dependencies \
    -DincludeScope=runtime -DoutputDirectory=/jdbc/providers

# start --optimized rejects changes to build-time options at runtime: bake them here.
# In 26.7.4 HTTP_RELATIVE_PATH is build-time; CACHE and CACHE_STACK are runtime.
FROM quay.io/keycloak/keycloak:26.7.4 AS builder
COPY --from=jdbc --chown=keycloak:keycloak /jdbc/providers/ /opt/keycloak/providers/

# Apple Identity Provider for Keycloak (https://github.com/klausbetz/apple-identity-provider-keycloak)
# v1.17.0 is the first release compatible with Keycloak >= 26.5. Providers must be present
# before `kc.sh build` runs. Pin by digest so a compromised/rotated release asset fails the
# build instead of silently changing behavior; bump both the version and the checksum
# together (see infra/keycloak/README.md).
ADD --checksum=sha256:4091dee2a1ec9e0771bef4bd46005197d86b0a2b1f25198c41738476b1d102bb \
    --chown=keycloak:keycloak \
    https://github.com/klausbetz/apple-identity-provider-keycloak/releases/download/1.17.0/apple-identity-provider-1.17.0.jar \
    /opt/keycloak/providers/apple-identity-provider-1.17.0.jar

ENV KC_DB=postgres \
    KC_DB_DRIVER=software.amazon.jdbc.Driver \
    KC_FEATURES_DISABLED=twitter-broker,identity-brokering-api \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true \
    KC_HTTP_RELATIVE_PATH=/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.7.4
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
