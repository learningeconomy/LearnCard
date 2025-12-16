---
description: Understanding xAPI Data in LearnCard
---

# xAPI Data

**What is this page about?** This page explains the Experience API (xAPI) and its significant role within the LearnCard ecosystem. We'll cover what xAPI is, how LearnCard systems (like the LearnCloud Storage API) can work with xAPI data, and most importantly, how these learning records connect to the Verifiable Credentials (VCs) you can issue and manage.

**Why is this important for you to understand?** xAPI provides a flexible way to track a wide range of learning experiences, both online and offline. By understanding how LearnCard integrates with xAPI, you can leverage these rich learning records to issue more meaningful, evidence-backed Verifiable Credentials. This bridges the gap between tracking learning activities and providing portable, verifiable proof of those achievements.

**What you'll learn:**

* A simple overview of xAPI and its purpose in capturing learning data.
* How LearnCard interacts with xAPI statements (e.g., storage and use as evidence).
* The powerful relationship between xAPI learning records and the Verifiable Credentials issued by LearnCard.
* How xAPI data can enrich the structure and claims within your VCs.

***

## What is xAPI (Experience API)?

The **Experience API (xAPI)**, often called "Tin Can API," is an open-source specification for learning technology that allows you to collect and share data about a wide spectrum of learning experiences. Think of it as a universal language for describing learning activities.

* **Core Idea:** xAPI records experiences as simple statements in an **"Actor - Verb - Object"** format.
  * _Example:_ `"Sarah (Actor) - completed (Verb) - 'Advanced Safety Training' (Object)."`
* **Flexibility:** Unlike older learning standards, xAPI isn't limited to tracking just course completions within a Learning Management System (LMS). It can capture almost any activity, such as:
  * Reading an article
  * Watching a video
  * Performing a task in a simulation
  * Attending a workshop
  * Collaborating on a project
* **Purpose:** To provide a detailed and comprehensive record of an individual's learning journey across various platforms and contexts.

## How LearnCard Leverages xAPI Data

LearnCard is designed to work with this rich learning data, primarily in two ways:

1. **Storing Learning Records:** The LearnCloud Storage API provides a dedicated route (e.g., `/xapi/statements`) for ingesting and storing xAPI statements. This allows applications to send learning activity data to LearnCard, creating a centralized (yet user-controlled) repository of learning experiences.
2. **Evidence for Achievements & Credentials:** Once xAPI statements are stored, they can serve as valuable, auditable **evidence** for skills, knowledge, or accomplishments. Instead of just claiming a skill, a user (or an issuer acting on their behalf) can point to a series of xAPI statements that demonstrate that skill in action or the completion of relevant learning.

## Connecting xAPI Statements to Verifiable Credentials

This is where the real power lies. While xAPI statements are detailed records of experiences, **Verifiable Credentials (VCs)** are the formal, secure, and portable proofs of those experiences or resulting achievements.

* **From Experience to Proof:** A collection of xAPI statements can provide the basis for issuing a VC.
  * _Example Scenario:_
    1. An education platform sends xAPI statements to LearnCloud Storage as a student progresses:
       * `"Student_Jane - completed - 'Module 1: Introduction to AI'."`
       * `"Student_Jane - passed - 'Module 1 Quiz'."`
       * `"Student_Jane - completed - 'Module 2: Machine Learning Basics'."`
       * `"Student_Jane - passed - 'Module 2 Quiz'."`
    2. Once all required statements are recorded, the education platform (as an Issuer) can use LearnCard to issue a Verifiable Credential to Student Jane, such as:
       * **VC Type:** `CourseCompletionCredential`
       * **Claim:** `"Course: AI Fundamentals - Completed"`
       * **Evidence (linked within the VC):** References to the relevant xAPI statements that prove completion.
* **Enriching Credentials:** xAPI data can be used to make VCs more detailed and trustworthy. Instead of a simple "Certificate of Completion," a VC can include or reference the specific learning activities (xAPI statements) that led to that achievement.
* **Automated Issuance:** Systems can be designed where specific patterns or collections of xAPI statements automatically trigger the issuance of a VC or a "Boost" in LearnCard.
* **Schemas & Data Models:** While xAPI has its own "Actor-Verb-Object" data model, LearnCard allows you to define **Schemas** for your VCs. You might design VC schemas that specifically accommodate references to xAPI evidence or claims derived directly from aggregated xAPI data.

## Benefits for Developers & Users

* **For Developers:**
  * Integrate rich learning activity data directly into the credentialing process.
  * Build applications that can issue more granular, evidence-backed VCs.
  * Leverage a standard (xAPI) for learning data, enhancing interoperability.
* **For Users (Learners/Workers):**
  * Gain more comprehensive and verifiable proof of their learning journey and achievements.
  * Have credentials that are not just assertions but are backed by a trail of learning experiences.
  * Greater portability and recognition of their skills and knowledge.

## xAPI URIs

### Understanding Activity IDs

When creating xAPI statements, you'll encounter two types of URLs:

1. **Standard xAPI Verbs**: These are predefined by ADL (Advanced Distributed Learning) and should be used as-is:

```javascript
verb: {
    id: "http://adlnet.gov/expapi/verbs/completed",
    display: {
        "en-US": "completed"
    }
}
```

2. **Activity IDs**: These are URIs you create to identify your activities:

```javascript
object: {
    id: "http://yourgame.com/activities/level-1/custom-challenge",
    definition: {
        name: { "en-US": "Level 1 Custom Challenge" },
        description: { "en-US": "First custom challenge of the game" },
        type: "http://adlnet.gov/expapi/activities/simulation"
    }
}
```

### Best Practices for Activity IDs

#### 1. Structure

* Use a consistent URI pattern
* Include meaningful path segments
* Keep IDs human-readable when possible

#### 2. Documentation

Best practice is to make these URIs resolvable to actual documentation. For example:

```javascript
// Good: Links to actual documentation
object: {
    id: "https://docs.yourgame.com/xapi/activities/custom-challenge",
    // ...
}

// Also acceptable, but less ideal: Non-resolvable URI
object: {
    id: "http://yourgame.com/activities/custom-challenge",
    // ...
}
```

If the URI is resolvable, it should lead to:

* Activity description
* Expected outcomes
* Related skills or competencies
* Usage context
* Any other relevant metadata

#### 3. Persistence

* Once you define an activity ID, maintain it
* Create new IDs for new versions of activities
* Don't reuse IDs for different activities

#### 4. Domain Usage

You can use:

* A domain you control (preferred)
* A made-up domain (acceptable)
* A subdomain specific to xAPI activities

The key is consistency and uniqueness within your system, but making URIs resolvable to actual documentation is strongly recommended for better interoperability and clarity.

Remember: While non-resolvable URIs are technically valid, resolvable URLs that link to activity definitions make your xAPI implementation more maintainable and useful to others who might need to understand your learning activities.

## Key Takeaways

* xAPI provides a standardized way to track diverse learning experiences as "Actor-Verb-Object" statements.
* LearnCard (e.g., via LearnCloud Storage API) can ingest and store these xAPI statements.
* Stored xAPI data serves as powerful evidence and can be the basis for issuing robust, trustworthy Verifiable Credentials.
* This connection allows for a richer, more detailed, and verifiable representation of an individual's learning and achievements.

By integrating xAPI concepts, LearnCard enables a more holistic approach to recognizing and verifying learning, bridging the gap between experiences and formal credentials.
