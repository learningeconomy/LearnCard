# Core Interaction Workflows

This page illustrates common end-to-end scenarios showing how participants interact on the LearnCard Network to achieve key goals like obtaining or presenting credentials.

## Send Verifiable Credentials

{% embed url="https://www.figma.com/board/DPGBfPLlss2K6KmDLCN3ul/LearnCard-Docs?node-id=130-63&t=fk1wywzjUFmakXJE-0" %}

## Send Boost Credentials

When you need to issue multiple credentials all tied to the same "template" credential, use a Boost Credential.

{% embed url="https://www.figma.com/board/DPGBfPLlss2K6KmDLCN3ul/LearnCard-Docs?node-id=130-192&p=f&t=fk1wywzjUFmakXJE-0" %}

## Issue, Accept, Verify, & Present Credentials

```mermaid
sequenceDiagram
    participant Issuer
    participant Core as "LearnCard Wallet SDK"
    participant Network as "LearnCloud Network API"
    participant Holder
    participant Verifier

    Issuer->>Core: "Create unsigned credential"
    Core-->>Issuer: "Unsigned credential"
    Issuer->>Core: "Issue credential (sign)"
    Core-->>Issuer: "Signed credential (VC)"

    Issuer->>Network: "Send credential to recipient"
    Network->>Holder: "Notify of incoming credential"
    Holder->>Network: "Accept credential"
    Network-->>Holder: "Credential available"

    Holder->>Verifier: "Present credential"
    Verifier->>Core: "Verify credential"
    Core->>Core: "Check signature"
    Core->>Core: "Check expiration"
    Core->>Core: "Validate schema"
    Core-->>Verifier: "Verification result"

    Note over Issuer,Verifier: "Alternative: Direct issuance without network"
    Issuer->>Core: "Issue credential"
    Core-->>Issuer: "Signed credential"
    Issuer->>Holder: "Direct transfer (QR, file, etc.)"
    Holder->>Core: "Store credential"
    Holder->>Verifier: "Present credential"
```



## Manage Connections Between Profiles <a href="#connection-management" id="connection-management"></a>

The LearnCard Network implements a bidirectional connection system similar to "friend" relationships in social networks. These connections enable profiles to share credentials, boosts, and other data with each other.

```mermaid
stateDiagram-v2
    [*] --> NOT_CONNECTED
    NOT_CONNECTED --> PENDING_REQUEST_SENT: connectWith()
    NOT_CONNECTED --> PENDING_REQUEST_RECEIVED: Received request
    PENDING_REQUEST_SENT --> NOT_CONNECTED: cancelConnectionRequest()
    PENDING_REQUEST_SENT --> CONNECTED: Request accepted
    PENDING_REQUEST_RECEIVED --> NOT_CONNECTED: Request rejected
    PENDING_REQUEST_RECEIVED --> CONNECTED: acceptConnectionRequest()
    CONNECTED --> NOT_CONNECTED: disconnectWith()

    state BLOCKED {
        [*] --> BLOCKED_STATE
        BLOCKED_STATE --> [*]: unblockProfile()
    }

    NOT_CONNECTED --> BLOCKED: blockProfile()
    PENDING_REQUEST_SENT --> BLOCKED: blockProfile()
    PENDING_REQUEST_RECEIVED --> BLOCKED: blockProfile()
    CONNECTED --> BLOCKED: blockProfile()
```

### Connection States <a href="#connection-states" id="connection-states"></a>

Connections between profiles can be in one of these states (defined in `LCNProfileConnectionStatusEnum`):

* `NOT_CONNECTED`: No connection exists between profiles
* `PENDING_REQUEST_SENT`: The current profile has sent a connection request that's awaiting acceptance
* `PENDING_REQUEST_RECEIVED`: The current profile has received a connection request awaiting action
* `CONNECTED`: The profiles have an active bidirectional connection

### Connection Invitations <a href="#connection-invitations" id="connection-invitations"></a>

The system supports direct connection via invitation:

* `generateInvite`: Creates a time-limited invitation challenge
* `connectWithInvite`: Establishes a connection using a valid challenge

This is useful for connecting profiles without requiring the standard request-accept flow, such as when onboarding users from an external system.

```mermaid
sequenceDiagram
    participant ProfileA as "Profile A"
    participant System as "LearnCloud Network API"
    participant ProfileB as "Profile B"

    ProfileA->>System: generateInvite()
    System-->>ProfileA: { profileId, challenge, expiresIn }

    Note over ProfileA,ProfileB: Share invitation outside the system

    ProfileB->>System: connectWithInvite({ profileId, challenge })
    System->>System: Validate invitation

    alt Valid invitation
        System->>System: Create connection between profiles
        System-->>ProfileB: true (success)
        System->>System: Invalidate invitation
    else Invalid or expired
        System-->>ProfileB: 404 Not Found Error
    end
```

## Notifications & Webhooks

In addition to direct request-response patterns, the LearnCloud Network utilizes an asynchronous notification system to inform applications and users of important events in real-time, such as receiving a new credential or a connection request. This is typically achieved by configuring a webhook.&#x20;

```mermaid
sequenceDiagram
    participant App as "Client App"
    participant Brain as "LearnCloud Network API"
    participant SQS as "SQS Queue"
    participant Worker as "Lambda Worker"
    participant Webhook as "Notification Webhook"

    App->>Brain: Perform action (e.g., send boost)
    Brain->>SQS: addNotificationToQueue()
    SQS->>Worker: notificationsWorker()
    Worker->>Worker: Parse notification
    Worker->>Webhook: sendNotification() HTTP request
    Note right of Webhook: External notification service
    Webhook-->>Worker: Acknowledge notification
```

For detailed information on configuring webhooks and the specific event payloads, refer to the [Notifications & Webhooks guide in the LearnCloud Network API Reference](../../sdks/learncard-network/notifications.md)

