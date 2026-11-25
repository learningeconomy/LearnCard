# Web social account linking

Google and Apple require `email_verified` matching `^true$`; missing or false claims are rejected.
Both trust that verified email and use the dedicated `social first broker login` flow.
Review Profile is disabled; create-if-unique and auto-link run in order as ALTERNATIVE executions.
Auto-linking an existing verified-email account matches native lca-api and Firebase behavior, without an email-verification page or SMTP.
The residual risk is an upstream account asserting a verified email the person no longer controls.
The hidden lca-api broker keeps its existing flow; migrated users are pre-linked separately by the provisioning tool.
In Keycloak 26.7.4, [create-if-unique](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/authentication/authenticators/broker/IdpCreateUserIfUniqueAuthenticator.java) records the collision and [auto-link](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/authentication/authenticators/broker/IdpAutoLinkAuthenticator.java) consumes it: no detect-existing execution or subflow is needed.
