---
description: What is a plugin?
---

# Plugin System

The LearnCard Plugin System is the modular foundation that enables extensibility of the LearnCard Core through encapsulated units of functionality. This document explains how plugins are structured, loaded, and used within the LearnCard ecosystem.&#x20;

### Plugins Are:

* Core bundles of execution.
* Have no hard requirements they must conform to.
* Atomic.
* Not categorical.
* Typically fall into larger execution workflows. _See_ [_Control Planes_](control-planes.md)_._

Plugins can implement arbitrary functionality, or optionally choose to implement any number of Control Planes. Via a common instantiation pattern, it is also easily possible for plugins to depend on other plugins via their exposed interfaces, as well as to happily hold private and public fields.

The LearnCard Core is designed with minimal base functionality, which is extended through plugins that provide specific capabilities. The plugin system enables developers to include only the features they need, resulting in more lightweight and focused implementations.

{% hint style="info" %}
Plugins are at the heart of LearnCard. The base LearnCard wallet without _any_ plugins attached to it can do, well... nothing!&#x20;
{% endhint %}

Additionally, because plugins and plugin hierarchies work entirely through interfaces rather than explicit dependencies, any plugin can be easily hotswapped by another plugin that implements the same interface, and plugins implementing Control Planes can easily be stacked on top of each other to further enhance the functionality of that Control Plane for the wallet.



```mermaid
graph TD
    subgraph "LearnCard Instance"
        Core["LearnCard Wallet SDK"]
        
        subgraph "Plugin Registry"
            P1["Plugin A"]
            P2["Plugin B"]
            P3["Plugin C"]
        end
        
        Core --- P1
        Core --- P2
        Core --- P3
    end
    
    App["Application"] --> Core
```

### Plugin Interface&#x20;

A LearnCard plugin follows a standard interface structure which includes:

* **name**: A unique identifier string
* **displayName**: A human-readable name for UI display
* **description**: A description of the plugin's functionality
* **methods**: An object containing the functions provided by the plugin

The type system uses generics to track which plugins are added to a LearnCard instance, ensuring type safety when accessing plugin methods.

### Adding Plugins

In order to create a fully functioning LearnCard, you will need to add some plugins. Specifically, you will (probably) want to add at least one plugin that implements each Control Plane.

{% hint style="info" %}
To learn more about [Control Planes](control-planes.md), as well as find recommended Plugins for each Control Plane, click [here](control-planes.md)!
{% endhint %}

In code, constructing a LearnCard completely from scratch looks like this:

```typescript
const baseLearnCard = await initLearnCard({ custom: true });
const didkitLearnCard = await baseLearnCard.addPlugin(await getDidKitPlugin());
const didkeyLearnCard = await didkitLearnCard.addPlugin(await getDidKeyPlugin(didkitLearnCard, 'a', 'key'));
// repeat for any more plugins you'd like to add
```

However, you don't have to start from scratch! Each instantiation function is completely able to add bespoke plugins to it:

```typescript
const emptyLearnCard = await initLearnCard();
const customLearnCard = await emptyLearnCard.addPlugin(CustomPlugin);
```

```mermaid
sequenceDiagram
    participant App as "Application"
    participant Init as "initLearnCard()"
    participant Core as "LearnCard Wallet SDK"
    participant Plugin as "Plugin"

    App->>Init: Call with configuration and plugins
    Init->>Core: Create base LearnCard instance

    loop For each plugin
        Init->>Plugin: Initialize plugin
        Plugin-->>Init: Return plugin object
        Init->>Core: Add plugin to LearnCard instance
    end

    Init-->>App: Return enhanced LearnCard instance

    App->>Core: learnCard.invoke.somePluginMethod()
    Core->>Plugin: Forward method call
    Plugin-->>Core: Return result
    Core-->>App: Return result to application
```

{% @github-files/github-code-block url="https://github.com/learningeconomy/LearnCard/blob/942bb5f7/packages/learn-card-core/src/types/LearnCard.ts#L1-L7" %}

### Example: Expiration Plugin

Let's examine how the Expiration Plugin is implemented to understand a typical plugin structure:

```mermaid
graph TD
    Core["LearnCard Core"]
    VCPlugin["VC Plugin"]
    ExpirationPlugin["Expiration Plugin"]
    
    Core --- VCPlugin
    Core --- ExpirationPlugin
    
    ExpirationPlugin -..-> VCPlugin["Uses VC Plugin's verifyCredential"]
    
    subgraph "Expiration Plugin Methods"
        VerifyMethod["verifyCredential()"]
    end
    
    ExpirationPlugin --- VerifyMethod
    
    VerifyMethod --> CheckExpiration["Check expirationDate validFrom/validUntil"]
```

The Expiration Plugin extends the credential verification process to check expiration dates:

1. It depends on the VC Plugin's `verifyCredential` method
2. It calls the original method to perform base verification
3. It adds additional checks for credential expiration
4. It returns an enhanced verification result

This demonstrates how plugins can build upon each other's functionality in a composable manner.

{% @github-files/github-code-block url="https://github.com/learningeconomy/LearnCard/blob/942bb5f7/packages/plugins/expiration/src/index.ts#L10-L33" %}

### Interacting with Plugins

After initialization, applications interact with plugins through the LearnCard instance's `invoke` property. The method calls follow this pattern:

```mermaid
sequenceDiagram
    participant App as "Application"
    participant LC as "LearnCard Instance"
    participant Plugin as "Plugin"
    
    App->>LC: learnCard.invoke.methodName(args)
    LC->>Plugin: Find plugin with methodName
    Plugin->>Plugin: Execute method with args
    Plugin-->>LC: Return result
    LC-->>App: Return result to application
```

This unified interface allows applications to access all plugin functionality through a single entry point, abstracting away the details of which plugin provides which method.

### Plugin Data Types

Plugins often work with specific data types, particularly for credential operations. The core types used across plugins include:

| Type       | Description                                   |
| ---------- | --------------------------------------------- |
| UnsignedVC | Unsigned Verifiable Credential data structure |
| VC         | Signed Verifiable Credential with proof       |
| UnsignedVP | Unsigned Verifiable Presentation              |
| VP         | Signed Verifiable Presentation with proof     |
| Proof      | Cryptographic proof structure                 |
| Profile    | Entity profile information                    |

These types are defined in the `@learncard/types` package and used consistently across all plugins to ensure interoperability.

{% @github-files/github-code-block url="https://github.com/learningeconomy/LearnCard/blob/942bb5f7/packages/learn-card-types/src/vc.ts#L129-L158" %}

{% @github-files/github-code-block url="https://github.com/learningeconomy/LearnCard/blob/942bb5f7/packages/learn-card-types/src/vc.ts#L174-L177" %}

### Graph of Plugins

```mermaid
graph LR
    core["@learncard/core"]

    subgraph "Identity Plugins"
        didkit["DIDKit Plugin"]
        didweb["DID Web Plugin"]
        didkey["DID Key Plugin"]
        ethereum["Ethereum Plugin"]
    end

    subgraph "Credential Plugins"
        vc["VC Plugin"]
        vpqr["VPQR Plugin"]
        vcapi["VC API Plugin"]
        chapi["CHAPI Plugin"]
        templates["VC Templates Plugin"]
        expiration["Expiration Plugin"]
    end

    subgraph "Storage & Network"
        network["Network Plugin"]
        ceramic["Ceramic Plugin"]
        lcn["LearnCard Network Plugin"]
        learncloud["LearnCloud Plugin"]
    end

    subgraph "Utility Plugins"
        crypto["Crypto Plugin"]
        encryption["Encryption Plugin"]
        dynamic["Dynamic Loader Plugin"]
    end

    core --- didkit
    core --- didweb
    core --- didkey
    core --- ethereum
    core --- vc
    core --- vpqr
    core --- vcapi
    core --- chapi
    core --- templates
    core --- expiration
    core --- network
    core --- ceramic
    core --- lcn
    core --- learncloud
    core --- crypto
    core --- encryption
    core --- dynamic

    init["@learncard/init"] -->|"orchestrates"| core
```

