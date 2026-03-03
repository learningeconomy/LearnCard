---
description: What is GameFlow?
---

# GameFlow Overview

<figure><img src="../../.gitbook/assets/image (17).png" alt=""><figcaption></figcaption></figure>

## 🔍 What is GameFlow?

**GameFlow** is a lightweight integration framework built on top of LearnCard’s robust **ConsentFlow** system. It’s designed to help **educational games** and **learning apps** securely connect to a child’s LearnCard wallet, enabling features like badge issuance, progress tracking, and xAPI logging—all while putting **guardian consent and privacy** at the center.

### ✨ Key Features and Benefits

* **🔒 Secure Credential Exchange**\
  Games can issue **verifiable credentials** (like badges or achievements) directly to a child’s LearnCard wallet upon completion of specific milestones.
* **👨‍👩‍👧 Guardian Consent Built-In**\
  GameFlow is optimized for child-centered learning. It includes flows that **require a parent or guardian to approve** access and data sharing before any connection or credential issuance happens.
* **🛡️ Data Ownership & Privacy**\
  By leveraging ConsentFlow, GameFlow ensures learners (and their guardians) always know what’s being shared and have the power to **control and revoke access**.
* **📊 Optional xAPI Logging**\
  Games can optionally report learning activity using **xAPI statements**, authenticated with a **Delegate Credential**, so that learning analytics remain learner-owned and portable.

***

## 🔁 Two Entry Points for GameFlow

GameFlow can be initiated from **two directions**, depending on whether the experience begins inside your game or inside the LearnCard app:

***

### 🎮 Entry 1: Starting from Your Game

This flow begins when a child opens a game and wants to **connect it to LearnCard** for saving progress or earning badges.

**Step-by-step:**

1. **User opens the game** and selects an option like “Connect to LearnCard” (via button or QR code).
2. They’re prompted to **get an adult** to continue—ensuring COPPA-friendly guardian involvement.
3. The adult selects or adds the child’s LearnCard profile.
4. They review the access request and **consent to connect** the game.
5. The game is now linked to the child’s LearnCard, and they return to **continue playing seamlessly.**

✅ This is ideal for onboarding new users in-game and offering immediate access to rewards and credentials.

***

### 📱 Entry 2: Starting from the LearnCard App

This flow starts when a guardian or child **discovers the game inside the LearnCard app store**.

**Step-by-step:**

1. The user browses the **LearnCard app ecosystem** and chooses a game (like “Cooking with Cookie”).
2. They tap “Connect” and are prompted to **authorize access**—just like in the game-initiated flow.
3. The guardian selects the child’s profile and **consents** to connect the game.
4. Upon success, the user is returned to the game to begin playing—with LearnCard integration already active.

✅ This is great for **discoverability** and for guardians who prefer to initiate and manage app connections directly from LearnCard.

***

## 🧠 Why Use GameFlow?

By using GameFlow, developers don’t need to reinvent secure identity, consent, and credentialing systems. You can:

* Trust that **data is protected** and **parental consent is verified.**
* Offer **portable credentials** kids can take from game to game.
* Log learning activity in ways that support teachers, researchers, and families—with **zero lock-in.**

GameFlow makes it easy to do the right thing—for kids, for learning, and for privacy.
