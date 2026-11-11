# Resolve the complete runtime graph, verifying Maven Central checksums strictly.
# No Maven/JDK build tooling is copied into the runtime image.
FROM maven:3.9-eclipse-temurin-26@sha256:b2c1ad85954592f9928e84327c65201f308ad9b5d8ed7d5b823717c97bf23fbb AS jdbc
WORKDIR /jdbc
COPY jdbc/pom.xml ./pom.xml
RUN mvn --batch-mode --no-transfer-progress --strict-checksums \
    org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy-dependencies \
    -DincludeScope=runtime -DoutputDirectory=/jdbc/providers

# start --optimized rejects changes to build-time options at runtime: bake them here.
# In 26.7.4 HTTP_RELATIVE_PATH is build-time; CACHE and CACHE_STACK are runtime.
FROM quay.io/keycloak/keycloak:26.8.0 AS builder
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

FROM quay.io/keycloak/keycloak:26.8.0
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
