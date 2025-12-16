---
description: ConsentFlow, Contract structure, Access Levels
---

# Consent & Permissions

## **What is this section about?**&#x20;

This section explains how control over data and actions is managed within LearnCard. It details how individuals and entities grant permission for their information to be used or shared, how formal agreements (Contracts) define these permissions, and how different Access Levels determine who can do what.

### **Why is this important for you to understand?**&#x20;

User agency, data privacy, and clear authorization are fundamental to a trustworthy system. Understanding how consent is given and managed (ConsentFlow), the structure of agreements that govern data sharing (Contracts), and the meaning of various Access Levels is critical. This knowledge enables you to build applications that are respectful of user rights, compliant with data policies, and clear about what actions are permitted. It's similar to understanding privacy settings and user agreements, but designed for verifiable data exchange.

### **What you'll learn:**&#x20;

You'll learn about the lifecycle of consent, how data sharing and usage terms are formally defined in Contracts, and how different Access Levels control interactions with profiles and data.

***

### 🧾 Consent & Selective Disclosure

Learners and workers own their data. LearnCard supports:

* **Granular consent**: Share only the parts of a record that are needed.
* **ZKPs (Zero-Knowledge Proofs)**: Prove something without revealing everything.
* **BBS+ Signatures**: Enable selective disclosure of credential fields.

This ensures privacy, security, and compliance with data protection best practices.

***

### 🔐 ConsentFlows

**ConsentFlows** define how data can be read from or written to a user’s wallet—with their explicit permission.

Use ConsentFlow contracts to:

* Request only specific fields from credentials
* Enforce write permissions with fine-grained rules
* Respect data ownership at every step

ConsentFlows power integrations like GameFlow and are especially useful in educational or family contexts.
