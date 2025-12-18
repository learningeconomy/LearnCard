---
description: A Unified Infrastructure for Learning and Work
---

# U.S. State API

At its core, the **U.S. State API** is a comprehensive, state-level infrastructure for creating, managing, and exchanging Learning and Employment Records (LERs). It is designed to break down the data silos that currently exist between K-12 districts, higher education institutions, workforce development agencies, and employers.

Think of it as the digital plumbing for a state's entire learning and work ecosystem. Just as a physical state provides roads and bridges to connect its cities, the U.S. State API provides the secure, standardized pathways for data to flow between its educational and economic institutions.

## The Problem It Solves

For decades, a learner's journey has been fragmented. Their K-12 records are in one system, their college transcript in another, their professional certifications in a third, and their work history is scattered across various employers. This creates significant challenges:

* **For Learners:** It's incredibly difficult to build a complete picture of their own skills and achievements. They cannot easily carry their records with them, limiting their ability to pursue new educational and career opportunities.
* **For States and Institutions:** The lack of a common language and infrastructure makes it nearly impossible to understand workforce needs, create effective educational pathways, or measure the true impact of their programs.
* **For Employers:** Verifying a candidate's skills and qualifications is a slow, manual, and often unreliable process.

The U.S. State API is designed to solve this fundamental problem of fragmentation by creating a single, cohesive ecosystem built on user ownership and interoperability.

## The Architecture: A Stack of Composable Services

The U.S. State API is not a single, monolithic application. It is a suite of distinct, interoperable microservices that can be composed and deployed to meet the specific needs of a state. This "stack" approach provides both power and flexibility.

Here is a breakdown of the key services and their functions:

### **Core Identity & Data Services**

* [**Identity API**](../identities-and-keys/)**:** The foundation of the stack. It manages the creation and resolution of Decentralized Identifiers (DIDs) for individuals and organizations, ensuring everyone has a secure, self-sovereign digital identity.
* [**Storage API**](../../sdks/learncloud-storage-api/)**:** Provides the secure, private data stores for each user—their **LearnCard Passport** (for user-managed data) and their **Learning and Employment Record (LER)** (for institutional data).
* [**Data API**](https://campusapi.org/)**:** A powerful service for ingesting, transforming, and harmonizing data from disparate sources (like a Student Information System) into a standardized format.
* [**Media API:**](/broken/pages/017412f24eb0f2a9c95a7379c4a9c23f78713ce3) Manages the storage and delivery of rich media files (images, videos, documents) that can be associated with credentials as evidence.

### **Credential Lifecycle Services**

* [**Issuing API:**](../../how-to-guides/send-credentials.md) The engine for creating credentials. This includes our [**Universal Inbox**](../network-and-interactions/universal-inbox.md), which radically simplifies the process of sending a verifiable record to any user via an email or phone number.
* [**Verification API**](../../tutorials/verify-credentials.md)**:** Provides tools for employers and institutions to instantly and reliably verify the authenticity of a credential presented by a user.
* [**Registry API**](../identities-and-keys/trust-registries.md)**:** Manages the "trusted list" of authorized issuers within the state's ecosystem, ensuring that only vetted organizations can issue official records.
* [**Consent API:**](../consent-and-permissions/consentflow-overview.md) A user-centric service that allows individuals to grant fine-grained, revocable consent for how their data is accessed and shared.

### **Value-Add & Intelligence Services**

* [**Network API**](../../sdks/learncard-network/)**:** Manages the relationships and data flows between all the participants in the network—learners, issuers, verifiers, etc.
* [**Skills Mapping API**](https://opensalt.net/cfdoc/)**:** Uses AI to analyze credentials, job descriptions, and course catalogs to identify and map skills, making it easier to see the connections between education and employment.
* [**Pathways API:**](https://opensalt.net/cfdoc/) Helps visualize and construct learning and career pathways by connecting credentials and skills across different providers.
* [**Insights API**](../../introduction/ecosystem-architecture.md#learncloud-ai-api)**:** Provides governed analytics and reporting tools for state agencies to understand workforce trends, skills gaps, and program effectiveness in aggregate, without compromising individual privacy.
* [**AI Tutors API:**](../../introduction/ecosystem-architecture.md#learncloud-ai-api) An advanced service that can power personalized learning experiences by leveraging the rich data within a user's LER to provide contextual guidance and support.

By breaking the platform down into these composable services, we provide states with a solution that is both incredibly powerful and adaptable to their unique needs and existing infrastructure.
