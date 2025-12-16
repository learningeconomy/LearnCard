---
description: 'Understanding Trust Registries: Who to Trust in the Digital Credential World'
---

# Trust Registries

## **What is this section about?**&#x20;

In the new world of digital, verifiable credentials, you might receive a digital certificate or badge from an organization. But how do you (or the application you're using) know if that organization is who they say they are, or if they are generally considered legitimate? This is where "Trust Registries" come into play. This explainer will help you understand what Trust Registries are, why they are a crucial piece of the digital trust puzzle, and how systems like LearnCard work with different types of registries, each with its own rules.

### **Why is this important for you to understand?**&#x20;

Trust is the cornerstone of any credentialing system. Whether it's a university degree, a professional license, or a community badge, its value depends on trusting the entity that issued it. In the digital realm, Trust Registries provide a way to help establish that trust, making digital credentials more reliable and useful. Understanding them helps you appreciate how we determine the legitimacy of digital information.

### **What you'll learn:**

* What a Trust Registry is in simple terms.
* Why Trust Registries are essential for verifying digital credentials.
* How multiple "federated" registries can work together.
* The importance of governance for each registry.
* The main kinds of registries LearnCard interacts with, like JSON-based and OIDF registries.

## What is a Trust Registry?

At its core, a **Trust Registry** is essentially a curated list. It's a published collection of digital identifiers (specifically **Decentralized Identifiers, or DIDs**) that belong to organizations or individuals who are recognized or vouched for by the entity that maintains the registry.

Think of it like:

* An **"approved vendor list"** for a company.
* A **directory of accredited universities** published by an education board.
* A **"Blue Checkmark" system** for certain types of online profiles, but managed by specific communities or organizations.

When an application encounters a DID (for example, the DID of an issuer on a digital credential), it can check against one or more Trust Registries. If the DID is listed, it provides some level of assurance that the issuer is known and recognized by the maintainer of that registry.

The information typically found in a registry entry for a DID includes details like the organization's name, website, and location. For example, a simple JSON-based registry might look like this snippet from `registries.learncard.com/trusted/registry.json`:

```json
{
    "registry": {
        "did:web:network.learncard.com:users:smartresume": {
            "name": "SmartResume",
            "location": "Little Rock, AR 72201",
            "url": "https://www.smartresume.com/"
        },
        "did:web:scoutnetwork.org": {
            "name": "ScoutPass",
            "location": "Kuala Lumpur, Malaysia",
            "url": "https://pass.scout.org/"
        }
        // ... more entries
    }
}

```

Here, `did:web:network.learncard.com:users:smartresume` is the digital identifier, and the associated information tells us it's "SmartResume."

## Why Do Trust Registries Matter? The Problem of Trust in a Decentralized World

Verifiable Credentials and DIDs are powerful because they can be decentralized – anyone can create a DID, and anyone can issue a credential. But this openness also presents a challenge: if you receive a digital credential claiming to be from "State University" with an issuer DID like `did:example:12345`, how do you know it's the _real_ State University and not an imposter?

Trust Registries help address this. They don't provide absolute, universal proof (as trust is complex), but they offer a crucial layer of verification by allowing you to check if an issuer's DID is recognized by one or more known organizations or communities. They help answer the question: _"Is this issuer known and generally considered legitimate according to the criteria of a particular group or authority?"_

## Federated Registries: A Network of Trust, Not a Single Source

It's important to understand that there isn't just _one_ global, all-encompassing Trust Registry that everyone uses for everything. That would recreate a centralized system, which DIDs and VCs often aim to move beyond.

Instead, we have a system of **Federated Registries**. This means:

* **Multiple, Independent Registries:** Different organizations, consortiums, industries, or communities can maintain their own Trust Registries, each with its own focus, criteria for inclusion, and level of authority.
*   **LearnCard Knows Many:** Systems like LearnCard can be configured to be aware of and consult multiple such registries. For example, `registries.learncard.com/known-did-registries.json` lists several registries that LearnCard can check:

    ```json
    [
        {
            "name": "LEF Member Registry",
            "type": "dcc-legacy", 
            "governanceUrl": "https://learningeconomy.io",
            "url": "https://registries.learncard.com/trusted/registry.json"
        },
        {
            "name": "Credential Engine Test Issuer Registry",
            "type": "oidf",
            "governanceUrl": "https://credentialengine.org/",
            "trustAnchorEC": "https://test.issuerregistry.credentialengine.org/oidfed/.well-known/openid-federation"
        },
        // ... and more
    ]

    ```
* **Contextual Trust:** This federated approach allows for contextual trust. A university might be listed in an educational consortium's registry, while a software vendor might be in a technology alliance's registry. The "trust" you infer depends on your trust in the registry maintainer itself.
* **Order Can Matter:** If a DID appears in multiple registries that your system checks, the system might prioritize information from one registry over another based on a predefined order of authoritativeness (e.g., preferring a government-maintained registry over a community-maintained one for certain types of credentials).

Think of it like professional accreditations: a doctor might be accredited by a national medical board, a lawyer by a bar association, and an architect by an architectural institute. Each registry (accreditation body) is independent but contributes to a broader web of trust.

## Governance: Who Decides Who's In?

Since anyone can set up a list, what makes a Trust Registry trustworthy itself? The answer lies in its **governance**.

* **Rules of the Road:** Each Trust Registry operates under its own set of rules, policies, and procedures that determine:
  * Who can be listed.
  * What criteria must be met for inclusion.
  * How information is verified before being added.
  * How often entries are reviewed or updated.
  * How disputes or inaccuracies are handled.
* **Transparency is Key:** The credibility of a registry often depends on the transparency and rigor of its governance model. Many registries provide a `governanceUrl` (as seen in the examples above) where you can learn about these rules.
* **Trust is Transitive (to a degree):** When you decide to rely on a particular Trust Registry, you are effectively placing some trust in its governance model and the entity that maintains it.

So, when a system checks a DID against a registry, the "trust" isn't just about the DID being present; it's about the DID meeting the standards set forth by that registry's specific governance.

## Types of Trust Registries LearnCard Interacts With

LearnCard is designed to work with different types of Trust Registries to provide flexibility and broad interoperability. The main kinds you'll see referenced are:

1. **JSON Registries (e.g., "dcc-legacy" type):**
   * **What they are:** These are often straightforward, publicly accessible files in JSON (JavaScript Object Notation) format. They typically contain a list of DIDs, and for each DID, associated metadata like the organization's name, website, and location.
   * **Example:** The `registries.learncard.com/trusted/registry.json` file is a good example. It's a simple list that applications can fetch and parse.
   * **Simplicity:** Their main advantage is simplicity in creation and consumption.
2. **OIDF Registries (OpenID Federation):**
   * **What they are:** These registries use a more dynamic and standardized set of protocols based on the OpenID Federation specification. Instead of a static list, entities in an OIDF registry publish their own "Entity Configuration" (EC) at a well-known URL. This EC contains their metadata and information about how they relate to other entities in the federation.
   * **How it works:** A system like LearnCard starts with a "Trust Anchor" (a trusted starting point, often an Entity Configuration URL like `https://registry.dcconsortium.org/.well-known/openid-federation` for the "DCC Member Registry"). From this anchor, it can discover other entities and their metadata within that federation.
   * **Dynamic & Standardized:** OIDF provides a more robust and scalable framework for establishing and discovering trust relationships, especially in larger, more complex ecosystems.

## How LearnCard Uses Trust Registries (A Glimpse)

When LearnCard encounters a Verifiable Credential, it can use the issuer's DID to query the Trust Registries it knows about.

* If the issuer's DID is found in a trusted registry, LearnCard can retrieve additional information about the issuer (like their official name and website).
* This helps in the verification process by providing more context and confidence about the issuer's identity. It doesn't automatically mean the credential's _content_ is true, but it helps confirm the _source_ is recognized.

For example, if you receive a credential from `did:web:some-university.edu`, LearnCard might check a registry of educational institutions. If that DID is listed with the name "Some University" and a link to their official website, it adds a layer of assurance.

## Conclusion: Trust is Contextual and Layered

Trust Registries are a vital component in making the decentralized world of Verifiable Credentials practical and trustworthy. They provide a mechanism for recognizing legitimate actors and verifying their identities.

{% hint style="info" %}
## **Key takeaways**

* Trust Registries are curated lists of recognized DIDs.
* They help verify the legitimacy of issuers of digital credentials.
* The digital world uses a **federated** model, meaning many independent registries exist, each with its own **governance** and criteria.
* LearnCard can interact with various types of registries, including simple JSON lists and more dynamic OIDF-based federations.
{% endhint %}

Ultimately, the "trust" derived from a registry is always contextual—it depends on the credibility and rules of the registry itself. By understanding how they work, you can better appreciate the layers of verification that contribute to building a more trustworthy digital future.
