---
description: Store and Retrieve Credentials however you like!
---

# URIs

## What are LearnCard URIs?

The LearnCard URI is a [URI](https://en.wikipedia.org/wiki/Uniform\_Resource\_Identifier) that allows a Universal Wallet to resolve a credential. It is freely extensible and any plugin can add to it in any way. However standard plugins will adhere to a format of `lc:${method}:${location}`. For example, the Ceramic plugin adds `lc:ceramic:${streamID}` URI support.

## Why use LearnCard URIs?

Verifiable Credentials need to be stored somewhere. LearnCard does not dictate _where_ they can be stored. So, _LearnCard URIs_ (often referred to as just URIs) were devised to be able to seamlessly retrieve credentials that can be stored anywhere a plugin allows

## When would I use a LearnCard URI?

For the most part, URIs get used by Read, Store, and Index Control Planes. Basically, Verifiable Credentials are converted into a URI by the Store Plane, saved in the holder's list with the Index Plane, then later read from the holder's list and resolved back into a Credential with the Read Plane.

However, URIs can also be very useful whenever you need to transport a credential and you know that LearnCard is being used, such as between your own networked systems.&#x20;

## How can I use URIs?

Simply use `lc.store.upload` to convert a Verifiable Credential into a URI that you can then do things with, such as store and send. To get the Verifiable Credential back, use `lc.read.get` on the URI.
