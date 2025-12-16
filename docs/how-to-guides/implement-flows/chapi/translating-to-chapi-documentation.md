---
description: How to translate LearnCard's methods into the CHAPI documentation's methods
---

# ↔ Translating to CHAPI documentation

## For Wallets

CHAPI exposes four main methods from its two packages:

* `loadOnce` from `credential-handler-polyfill`
* `installHandler` from `web-credential-handler`
* `activeHandler` from `web-credential-handler`
* `receiveCredentialEvent` from `web-credential-handler`

LearnCard exposes three of these methods for you, while implicitly calling `loadOnce` for you at construction time in the CHAPI plugin.

* `learnCard.invoke.installChapiHandler` wraps `installHandler`
* `learnCard.invoke.activateChapiHandler` wraps `activeHandler`
* `learnCard.invoke.receiveChapiEvent` wraps `receiveCredentialEvent`

In the case of `installHandler` and `receiveCredentialEvent`, these two methods are exposed directly, with only types added to help make them easier to use.

When using `activeChapiHandler` instead of `activateHandler`, LearnCard will default the `mediatorOrigin` to `` `https://authn.io/mediator?${encodedURIComponent(window.location.origin)` `` for you. This can be overrided by simply passing in a custom `mediatorOrigin` when calling `activateChapiHandler`.

## For Issuers

The method `storePresentationViaChapi` loosely wraps the `window.navigator.credentials.store` method. However, `learnCard.invoke.storePresentationViaChapi` will automatically convert a raw Verifiable Presentation into the `WebCredential` class for you before calling `window.navigator.credentials.store`.
