# R2: verified social email without automatic account linking

On Keycloak 26.7.4, enable `trustEmail` for Google and Apple, with the OIDC
essential-claim filter `email_verified=^true$`. Do not map a hardcoded verified
flag. Both providers inherit `OIDCIdentityProvider.setEmailVerified`: false trust
forces false verification; true trust honors the token claim, including Apple's
string `"true"`. A missing claim otherwise falls back to trusting the email, so
the filter rejects missing/false claims before first-broker login.

Keep the existing first-broker flow: unique user creation, otherwise **required
confirmation then ownership verification**. Neither auto-link nor detect-existing
broker-user is an ownership proof; neither is enabled. Review Profile stays off.
Trusting the upstream email does not skip collision detection or the proof step.
The Apple extension's separate token-exchange auto-link option is explicitly off.

Use Keycloak's account-link email for passwordless existing accounts. Configure
SMTP for deployed realms; the dev fixture targets a local test mail sink. Without
SMTP/delivery or valid existing credentials the collision cannot complete. The
hidden lca-api IdP requires an app-issued ticket, so merely adding it to the
reauthentication form would not implement an email-code ownership flow.

Source references (pinned versions):

- [OIDC claim filter and verified-email handling](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/broker/oidc/OIDCIdentityProvider.java)
- [Unique-user collision detection](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/authentication/authenticators/broker/IdpCreateUserIfUniqueAuthenticator.java)
- [Confirmation is not proof](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/authentication/authenticators/broker/IdpConfirmLinkAuthenticator.java)
- [Email challenge and SMTP failure behavior](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/authentication/authenticators/broker/IdpEmailVerificationAuthenticator.java)
- [Single-use email-link proof](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/authentication/actiontoken/idpverifyemail/IdpVerifyAccountLinkActionTokenHandler.java)
- [Google provider inherits OIDC handling](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/social/google/GoogleIdentityProvider.java)
- [Apple 1.17.0 browser handling and separate token-exchange auto-link](https://github.com/klausbetz/apple-identity-provider-keycloak/blob/1.17.0/src/main/java/at/klausbetz/provider/AppleIdentityProvider.java)

Do not assume every Google/Apple response always asserts a verified email. Google
can return third-party email addresses; Apple documents false verification for
some managed accounts. The explicit claim filter is the acceptance policy,
independent of provider marketing or email domain. An upstream verified email is
not used as sufficient proof to claim an existing LearnCard account.
