---
description: Seek Context, Find Clarity
---

# Dynamic Loader

{% hint style="danger" %}
**Warning!**

Usage of this Plugin is _strongly_ discouraged due to security and performance concerns! If there is a context that LearnCard isn't using, it is instead a much better idea to simply make a small plugin implementing the [Context Plane](../../core-concepts/architecture-and-principles/control-planes.md#context-control-plane) that resolves it rather than resort to dynamic context resolution!

See [https://www.w3.org/TR/json-ld11/#iana-security](https://www.w3.org/TR/json-ld11/#iana-security) for more details.
{% endhint %}

## Overview

If you're working in an environment where security is not as important, such as a playground or test environment, you may have a desire to simply resolve contexts dynamically by sending an HTTP request. The Dynamic Loader plugin does just that, and is included by default in most instantiation targets, and can be used by default by passing in `allowRemoteContexts: true` to the init function.

## Install

```bash
pnpm i @learncard/dynamic-loader-plugin
```

## Use Cases

While there are potentially a large number of use cases for dynamic context resolution in terms of making life easier and more convenient, the security concerns make many of those use cases too dangerous. Instead, it is recommended to try and avoid _ever_ using this plugin outside of a playground or test environment, where you can be absolutely certain that poor security would not make any kind of difference.
