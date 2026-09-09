# Listen to Webhooks

The LearnCloud Network sends your application a direct message (a "notification") as soon as an event occurs on a user's LearnCard profile. This direct message is sent to a specific web address (URL) that you provide, called a **webhook**.

**~15 minutes · Needs:** Node.js (v18+), a public URL (e.g., ngrok)

## Prerequisites

- [Your First Integration](../quick-start/your-first-integration.md) completed (LearnCard SDK initialized)
- A publicly accessible URL (e.g., via ngrok for local development)
- Basic understanding of HTTP POST requests and Express.js

---

## Part 1: How LearnCloud Notifications Work

The flow (as shown in ["Notifications & Webhook Reference"](../sdks/learncard-network/notifications.md)):

```mermaid
sequenceDiagram
    participant App as "Client App"
    participant Brain as "LearnCloud Network API"
    participant SQS as "SQS Queue"
    participant Worker as "Lambda Worker"
    participant Webhook as "Your Webhook Listener"

    App->>Brain: Perform action (e.g., send boost to a user)
    Brain->>SQS: addNotificationToQueue()
    SQS->>Worker: notificationsWorker()
    Worker->>Worker: Parse notification
    Worker->>Webhook: sendNotification() HTTP POST request
    Note right of Webhook: Your app receives the data!
    Webhook-->>Worker: Acknowledge notification (e.g., HTTP 200 OK)
```

When an event occurs, the LearnCloud Network API triggers an HTTP `POST` request to the registered webhook URL. Your application needs to be listening at that URL.

---

## Part 2: Setting Your Webhook URL in LearnCard

### **Step 2.1: Get Your Public Webhook URL**

- **If deploying to a server:** You'll have a public URL like `https://yourapp.com/api/learncard-webhook`.
- **For Local Development (using ngrok):**
    1. Install ngrok: [https://ngrok.com/download](https://ngrok.com/download)
    2. If your local listener will run on port 3000 (we'll set this up later), run: `ngrok http 3000`
    3. Ngrok will give you a public "Forwarding" URL (e.g., `https://xxxx-yyy-zzz.ngrok.io`). **This is your temporary public webhook URL.** Use the `https` version.

### **Step 2.2: Update Your LearnCard Profile**

Use the LearnCard SDK to update the profile. Set its `notificationsWebhook` field to your public URL.

```typescript
// Ensure yourLearnCardInstance is initialized and authenticated
// for the profile you want to configure.

async function setWebhookUrl(webhookUrl: string) {
    try {
        const profileUpdateData = {
            notificationsWebhook: webhookUrl,
        };

        const success = await yourLearnCardInstance.invoke.updateProfile(profileUpdateData);

        if (success) {
            console.log(`Successfully updated profile's webhook URL to: ${webhookUrl}`);
        } else {
            console.error('Failed to update profile with webhook URL.');
        }
    } catch (error) {
        console.error('Error setting webhook URL:', error);
    }
}

// Replace with your actual ngrok URL or deployed webhook URL
const myPublicWebhookUrl = 'https://YOUR_NGROK_OR_DEPLOYED_URL.io/learncard-notifications';
// setWebhookUrl(myPublicWebhookUrl); // Call this function once to set it up
```

{% hint style="success" %}
**Action:** Run a script with this function call (or integrate it into your app's profile settings) to update the profile you want to receive notifications for.
{% endhint %}

---

## Part 3: Building a Simple Webhook Listener

Create a server that listens for incoming notifications at the URL you configured using Node.js and Express.

### **Step 3.1: Project Setup**

```bash
mkdir learncard-webhook-listener
cd learncard-webhook-listener
npm init -y
npm install express body-parser
# If using TypeScript (optional, but recommended)
# npm install typescript @types/express @types/node ts-node --save-dev
# npx tsc --init
```

### **Step 3.2: Create Your Server (`listener.js` or `listener.ts`)**

```typescript
// listener.ts (or listener.js if not using TypeScript)
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000; // The port ngrok will forward to

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// This is your webhook endpoint.
// Make sure the path matches what you set in myPublicWebhookUrl
// (e.g., if URL is https://.../learncard-notifications, path is /learncard-notifications)
app.post('/learncard-notifications', (req, res) => {
    console.log('Received a notification!');

    // The actual notification data is in req.body
    const notificationPayload = req.body;
    console.log('Payload:', JSON.stringify(notificationPayload, null, 2));

    // --- Process the notification based on its type ---
    if (notificationPayload.type === 'CONNECTION_REQUEST') {
        const fromProfile = notificationPayload.from; // This is an LCNProfile object
        const message = notificationPayload.message;
        console.log(
            `Received CONNECTION_REQUEST from: ${fromProfile?.displayName || fromProfile?.profileId || 'Unknown'}`
        );
        console.log(`Message: ${message?.body}`);

        // Example action: Log it, send an internal alert, update your database, etc.
        // For now, we just log it.
    } else if (notificationPayload.type === 'CREDENTIAL_RECEIVED') {
        const fromProfile = notificationPayload.from;
        const credentialUris = notificationPayload.data?.vcUris;
        console.log(`Received CREDENTIAL_RECEIVED from: ${fromProfile?.displayName || 'Unknown'}`);
        console.log(`Credential URIs:`, credentialUris);
        // You might want to fetch these credentials using learnCard.read.get(uri)
    } else {
        console.log(`Received unhandled notification type: ${notificationPayload.type}`);
    }

    // --- IMPORTANT: Acknowledge receipt quickly! ---
    // Send a 200 OK response to LearnCloud to let it know you received the notification.
    // If LearnCloud doesn't get a quick 2xx response, it might retry sending,
    // leading to duplicate processing.
    res.status(200).send('Notification received');

    // Any long-running tasks based on the notification should be done asynchronously
    // AFTER sending this response (e.g., queue it for later processing).
});

app.listen(port, () => {
    console.log(`Webhook listener started on http://localhost:${port}`);
    console.log(`If using ngrok, ensure it's forwarding to this port.`);
    console.log(`Your webhook endpoint is POST http://localhost:${port}/learncard-notifications`);
});
```

### **Step 3.3: Running Your Listener**

- If using JavaScript: `node listener.js`
- If using TypeScript: `npx ts-node listener.ts`

And if you're developing locally, make sure `ngrok http 3000` (or your chosen port) is running in another terminal.

---

## Part 4: Triggering and Testing Your Webhook

Simulate an action that sends a `CONNECTION_REQUEST` notification to the profile whose webhook you configured.

### **Step 4.1: Perform an Action**

You need another LearnCard instance (`profileA_learnCard`) to act as the requester. The profile you configured with the webhook URL is `profileB_learnCard`.

```typescript
// In a separate script or part of your testing setup:
// Assume profileA_learnCard is initialized for Profile A
// Assume profileB_ProfileId is the profileId of the user/service you configured the webhook for in Part 2.

// const profileB_ProfileId = 'the-profile-id-with-webhook-configured';

// async function sendConnectionRequest() {
//   try {
//     console.log(`Profile A attempting to connect with ${profileB_ProfileId}`);
//     const success = await profileA_learnCard.invoke.connectWith(profileB_ProfileId);
//     if (success) {
//       console.log('Connection request sent successfully by Profile A!');
//     } else {
//       console.error('Failed to send connection request from Profile A.');
//     }
//   } catch (error) {
//     console.error('Error sending connection request:', error);
//   }
// }

// sendConnectionRequest();
```

{% hint style="success" %}
**Action:** Execute code similar to the `sendConnectionRequest` function above, where `profileA_learnCard` sends a connection request to the profile that has the webhook set up.
{% endhint %}

### **Step 4.2: Check Your Listener's Logs**

You should see output in your listener's console similar to:

```json
Webhook listener started on http://localhost:3000
If using ngrok, ensure it's forwarding to this port.
Your webhook endpoint is POST http://localhost:3000/learncard-notifications
Received a notification!
Payload: {
  "type": "CONNECTION_REQUEST",
  "to": { /* Profile B's details */ },
  "from": { /* Profile A's details */ },
  "message": {
    "title": "New Connection Request",
    "body": "Profile A DisplayName has sent you a connection request!"
  }
}
Received CONNECTION_REQUEST from: Profile A DisplayName
Message: Profile A DisplayName has sent you a connection request!
```

---

## Important Considerations

- **Security:** Always use `https` for your webhook URLs in production. Ngrok provides this automatically.
- **Asynchronous Processing:** As mentioned, respond with `200 OK` quickly. If you need to do significant processing (like database updates, sending other API calls), do it after sending the response, perhaps by adding the task to an internal queue.
- **Error Handling & Retries:** Build robust error handling in your listener. Be aware that LearnCloud might retry sending a notification if it doesn't receive a timely success response. Design your processing to be **idempotent** (processing the same notification multiple times doesn't cause unintended side effects).
- **Payload Reference:** This tutorial focused on `CONNECTION_REQUEST`. Refer to the [LearnCloud Network API Notifications Documentation](../sdks/learncard-network/notifications.md) for the structure of all other notification types (`CREDENTIAL_RECEIVED`, `CONSENT_FLOW_TRANSACTION`, etc.) and expand your listener to handle them as needed.

---

## What you should see

When you trigger a webhook, your listener's console should output the payload:

```json
{
    "type": "CONNECTION_REQUEST",
    "to": { "did": "did:key:z6M..." },
    "from": { "did": "did:key:z6M...", "displayName": "Profile A" },
    "message": {
        "title": "New Connection Request",
        "body": "Profile A has sent you a connection request!"
    },
    "data": {}
}
```

## Troubleshooting

| If…                                              | Then                                                                                            |
| :----------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| Webhook never arrives                            | Verify your ngrok URL matches the `notificationsWebhook` field exactly.                         |
| `Notification webhook transport failed with 404` | Your server is running, but the route path (e.g., `/learncard-notifications`) is incorrect.     |
| Duplicate webhooks                               | Your server is not returning a `200 OK` fast enough. Acknowledge the request before processing. |

## Next Steps

- Expand your listener to handle various other `type` values from the LearnCloud Network.
- Integrate more complex business logic into your webhook handler.
- Deploy your listener to a robust server or serverless environment for production use.
