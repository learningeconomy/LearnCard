---
description: Verifiable Credential structure, Schemas, Data Models, Boosts
---

# Credentials & Data

## **What is this section about?**

This section focuses on the _information_ itself—the digital records that are created, shared, and verified within the LearnCard system. We'll look closely at the structure of Verifiable Credentials (VCs), how their format is defined using Schemas, other important Data Models, and unique constructs like "Boosts."

### **Why is this important for you to understand?**&#x20;

The core value of LearnCard revolves around its ability to manage and exchange trustworthy, verifiable information. To build meaningful applications, you need to know how this information is structured, what it represents, and how to interpret it. Understanding VCs, Schemas, and concepts like "Boosts" is essential for creating, issuing, presenting, and verifying these digital assets correctly. This is like understanding the layout and content of an official certificate or a detailed project portfolio.

### **What you'll learn:**&#x20;

You'll explore the anatomy of a Verifiable Credential, how Schemas ensure consistency, how different pieces of data relate to each other through Data Models, and the specific role and structure of "Boosts."

***

### 🎓 Verifiable Credentials (VCs)

Verifiable Credentials are portable digital statements—like a diploma, badge, or license—that anyone can issue and anyone can verify.

* **Issuer**: The party who creates the credential (e.g. a school, platform, employer).
* **Holder**: The person or agent who owns the credential.
* **Verifier**: Anyone who needs to check that the credential is legit.

LearnCard uses the [W3C VC standard](https://www.w3.org/TR/vc-data-model/) to ensure global interoperability and verification.

***

### 📦 Verifiable Presentations (VPs)

A **Verifiable Presentation (VP)** is a bundle of one or more credentials that a user shares with another party.

* Think of it as a "credential folder" you can pass around
* Can be generated dynamically with selective fields
* Fully verifiable using DIDs and cryptographic proofs

***

### 🔓 Open Standards

Interoperability is built-in. LearnCard supports:

* **Open Badges v3 (OBv3)**
* **Comprehensive Learner Record (CLR)**
* **Learning Tools Interoperability (LTI)**
* **Learning and Employment Records (LER)**
* **Learner Information Framework (LIF)**

***

### ⚡ Boosts

A **Boost** is a superpowered VC. It follows OBv3 and W3C standards but adds:

* **Display metadata**: Control how credentials appear in wallets
* **Governance rules**: Enforce who can issue what
* **Network validation**: Confirm issuance rules were followed
* **Attachments**: Include files, PDFs, or resources

Think of Boosts as **VC+**—fully standards-compliant but better for real-world apps.
