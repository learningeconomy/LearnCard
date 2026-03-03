---
description: DIDs, Wallets, Key Management, Profile Types
---

# Identities & Keys

## **What is this section about?**&#x20;

This section explores how individuals, organizations, and even automated services are uniquely identified within the LearnCard ecosystem. We'll cover the different types of digital identities used, how they are created and managed, and the crucial role of cryptographic keys in keeping everything secure and interactions verifiable.

### **Why is this important for you to understand?**&#x20;

Secure and verifiable identity is the bedrock of trust in any digital interaction. Whether you're issuing a credential, receiving one, or verifying one, knowing who's who and how their identity is asserted and protected is paramount. Understanding these concepts helps you manage users and services effectively, control access, and ensure the integrity of all operations. It's like knowing the difference between a personal ID, a business license, and the keys that prove you own them.

### **What you'll learn:**&#x20;

You'll learn about Decentralized Identifiers (DIDs), the role of digital Wallets, the basics of Key Management (like public and private keys), and the different Profile Types that exist within LearnCard and when to use them.

***

### 🧰 Wallets

A **wallet** is where credentials live. It:

* Stores verifiable credentials
* Signs and verifies credentials
* Manages identity (via DIDs)
* Handles selective sharing and consent

LearnCard gives you an in-app wallet that can be embedded in your own app, bot, or backend.

***

### 🪪 Decentralized Identifiers (DIDs)

DIDs are unique, cryptographically-verifiable identifiers that aren’t tied to centralized registries.

* They let users prove ownership without relying on usernames or emails.
* LearnCard generates and manages DIDs under the hood.

DIDs are what make trust portable—and private.

***

### 🔁 DID Authentication

**DID Authentication** lets users prove ownership of their DID to log in or access services.

* Works like OAuth, but self-sovereign
* No passwords or emails needed
* Used across LearnCard to authorize actions

