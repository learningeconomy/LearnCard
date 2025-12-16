---
description: How to connect your AI client to LearnCard's MCP server
hidden: true
---

# Connect AI Agent

**Purpose**

Connect your AI assistant (e.g. Claude or ChatGPT) to LearnCard to enable personalized learning experiences. Your AI will be able to access your learning context, ask questions about your background, and save learning session summaries as verifiable credentials.

**LearnCard MCP Server URL (for reference):**

```
https://mcp.learncard.ai/
```

Below are instructions for connecting the LearnCard MCP server with Claude or ChatGPT.

***

## Claude

#### Claude **Pro or higher required**.

{% embed url="https://www.loom.com/share/a18c5bc1bd8349c5a80d898ecd149eb9" %}

<details>

<summary>Screenshots of steps</summary>

#### **Steps:**

1. Go to [https://claude.ai](https://claude.ai/) and sign in.
2. Click your profile picture (bottom-left).

<figure><img src="../../.gitbook/assets/image (14).png" alt=""><figcaption></figcaption></figure>

3. Click `Settings`

<figure><img src="../../.gitbook/assets/image (15).png" alt=""><figcaption></figcaption></figure>

4. Click `Connectors`

<figure><img src="../../.gitbook/assets/image (2).png" alt=""><figcaption></figcaption></figure>

5. Click `Add custom connector`

<figure><img src="../../.gitbook/assets/image (3).png" alt=""><figcaption></figcaption></figure>

6. Enter:

* **Name:** `LearnCard` &#x20;
*   **Remote MCP Server URL:**&#x20;

    ```
    https://mcp.learncard.ai/
    ```

<figure><img src="../../.gitbook/assets/image (17).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../.gitbook/assets/image (18).png" alt=""><figcaption></figcaption></figure>

7. Click `Add`

<figure><img src="../../.gitbook/assets/image (19).png" alt=""><figcaption></figcaption></figure>

8. Click `Connect` next to the LearnCard custom connector

<figure><img src="../../.gitbook/assets/image (20).png" alt=""><figcaption></figcaption></figure>

9. You should be re-directed to learncard.app. Sign in and click `Continue as <Your Name>`

<figure><img src="../../.gitbook/assets/image (22).png" alt=""><figcaption></figcaption></figure>

10. You should be redirected to claude.ai and see a confirmation. The connector will now show `Configure`.

<figure><img src="../../.gitbook/assets/image (24).png" alt=""><figcaption></figcaption></figure>

11. Now, to confirm Claude has access to the LearnCard connector during live chats, start a new chat with Claude and click this button:

<figure><img src="../../.gitbook/assets/image (25).png" alt=""><figcaption></figcaption></figure>

12. Make sure the LearnCard connector is enabled. It should be toggled on as shown in the picture below.

<figure><img src="../../.gitbook/assets/image (27).png" alt=""><figcaption></figcaption></figure>

13. Now, start a learning session with Claude. If it asks for permission to call the tools provided by the LearnCard connector, it’s working! Allow Claude to use the LearnCard connector and continue your AI tutoring session.

<figure><img src="../../.gitbook/assets/image (29).png" alt=""><figcaption></figcaption></figure>



</details>

***

## ChatGPT

#### ChatGPT Plus **or higher required**.

{% embed url="https://www.loom.com/share/d90d6fbb70c54514a0704f73735818cc" %}

<details>

<summary>Screenshots of steps</summary>

**Steps:**

1. Go to [https://chatgpt.com/](https://chatgpt.com/) and sign in.
2. Click your profile picture (bottom-left)

<figure><img src="../../.gitbook/assets/image (30).png" alt=""><figcaption></figcaption></figure>

3. Click `Settings`

<figure><img src="../../.gitbook/assets/image (31).png" alt=""><figcaption></figcaption></figure>

4. Click `Apps & Connectors`

<figure><img src="../../.gitbook/assets/image (32).png" alt=""><figcaption></figcaption></figure>

5. Scroll down

<figure><img src="../../.gitbook/assets/image (33).png" alt=""><figcaption></figcaption></figure>

6. Click `Advanced settings`

<figure><img src="../../.gitbook/assets/image (34).png" alt=""><figcaption></figcaption></figure>

7. Toggle on `Developer mode`

<figure><img src="../../.gitbook/assets/image (35).png" alt=""><figcaption></figcaption></figure>

8. Click `Back`&#x20;

<figure><img src="../../.gitbook/assets/image (37).png" alt=""><figcaption></figcaption></figure>

9. Click `Create app`

<figure><img src="../../.gitbook/assets/image (38).png" alt=""><figcaption></figcaption></figure>

10. Enter:

* **Name:** `LearnCard`
*   **MCP Server URL:**&#x20;

    ```
    https://mcp.learncard.ai/
    ```
* Check `I understand and want to continue`

<figure><img src="../../.gitbook/assets/image (39).png" alt=""><figcaption></figcaption></figure>



11. Click `Create`

<figure><img src="../../.gitbook/assets/image (40).png" alt=""><figcaption></figcaption></figure>

12. Sign in to learncard.app if prompted, then click `Continue as <Your Name>`

<figure><img src="../../.gitbook/assets/image (22).png" alt=""><figcaption></figcaption></figure>

13. You should be redirected back to chatgpt.com and see a confirmation. The connector will now show a red `Disconnect` button.

<figure><img src="../../.gitbook/assets/image (41).png" alt=""><figcaption></figcaption></figure>

14. Start a new chat with ChatGPT and click the `+` button

<figure><img src="../../.gitbook/assets/image (42).png" alt=""><figcaption></figcaption></figure>

15. Click `More` and select `LearnCard` .

    <figure><img src="../../.gitbook/assets/image (43).png" alt=""><figcaption></figcaption></figure>
16. ChatGPT should now show LearnCard attached to the chat input. When you send a message, ChatGPT will request permission to use the connector — that means it’s working! Approve access to continue your AI tutoring session.

<figure><img src="../../.gitbook/assets/image (45).png" alt=""><figcaption></figcaption></figure>



</details>
