---
description: 'How-To Guide: Join the LEF Trusted Issuer Registry'
---

# Verify My Issuer

This guide provides step-by-step instructions for organizations wishing to be recognized as trusted issuers within the LearnCard ecosystem by being added to the LEF Member Trusted Issuer Registry. The process involves submitting your organization's details via a Pull Request (PR) to our open-source LearnCard GitHub repository.

**Goal:** To successfully add your organization's DID and information to the `registry.json` file, making it a recognized issuer.

**Who is this for?** Organizations that issue or plan to issue Verifiable Credentials and wish to be listed in the LEF's primary trusted issuer registry.

{% hint style="info" %}
What is a Trusted Issuer Registry? [Click here to learn more in the Core Concepts documentation](../core-concepts/identities-and-keys/trust-registries.md).&#x20;
{% endhint %}

**What you'll need:**

* A **GitHub account**.
* Basic familiarity with **Git and GitHub Pull Requests**. If you're new to this, GitHub provides excellent [guides](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).
* Your organization's **official name**.
* Your organization's primary **website URL**.
* Your organization's **location** (City, State/Region, Country).
* The **Decentralized Identifier (DID)** your organization will use for issuing credentials (e.g., `did:web:yourdomain.com` or `did:key:z...`).
* A brief **description** of your organization and its role or purpose in issuing credentials.
* (Optional but Recommended) A URL to your organization's **governance document** or public statement regarding its credentialing practices.
* A **contact person** (GitHub username or email) for any questions regarding your submission.

## Procedure: Adding Your Organization to the Registry

Follow these steps carefully to submit your petition:

### **Step 1: Prepare Your Organization's Information**

Before you start, gather all the details listed in the "What you'll need" section above. Ensure they are accurate and official. The DID you provide should be the primary DID your organization will use as an issuer.

### **Step 2: Navigate to the Registry File on GitHub**

The LEF Member Trusted Issuer Registry is a JSON file located in the LearnCard repository.

* **Click this link to go directly to the file:** [https://github.com/learningeconomy/LearnCard/blob/main/packages/learn-card-registries/trusted/registry.json](https://github.com/learningeconomy/LearnCard/blob/main/packages/learn-card-registries/trusted/registry.json)

### **Step 3: Edit the `registry.json` File**

1. On the GitHub page for `registry.json`, click the **pencil icon** (Edit this file) in the upper right corner of the file view.
   * If you do not have direct write access to the repository, GitHub will automatically help you **fork the repository**. This creates a personal copy of the LearnCard repository under your GitHub account where you can make changes. Click "Fork this repository and propose changes."
2. You are now in the GitHub file editor. The `registry.json` file contains a main `registry` object, which holds key-value pairs. Each key is an issuer's DID, and the value is an object containing their details.
3.  **Carefully add a new entry for your organization** within the `registry` object. Find a logical place (e.g., alphabetical by DID, though exact order isn't strictly enforced by the format, it helps readability).

    * Ensure your entry follows the existing JSON structure.
    * The key for your entry **must be your organization's DID**.
    * The value must be an object with `name`, `location`, and `url` keys.

    **Example Entry Structure:**

    ```json
    "YOUR_ORGANIZATIONS_DID_HERE": {
        "name": "Your Official Organization Name",
        "location": "City, State/Region, Country",
        "url": "https://yourorganization.com/"
    }
    ```


4.  **Make sure to add a comma (`,`) after the preceding entry if yours is not the last one in the list.**

    **Example of adding an entry:** If the file looks like this:

    ```json
    {
        "meta": { ... },
        "registry": {
            "did:web:existing.org": {
                "name": "Existing Org",
                "location": "Some City, Country",
                "url": "https://existing.org/"
            } 
            // <--- Add your entry after this, so add a comma above
        }
    }
    ```
5.  **You would add your entry like this:**

    ```json
    {
        "meta": { ... },
        "registry": {
            "did:web:existing.org": {
                "name": "Existing Org",
                "location": "Some City, Country",
                "url": "https://existing.org/"
            }, // <--- Added comma here
            "did:web:yourneworg.com": { // <--- Your new entry
                "name": "My New Organization",
                "location": "New City, New Country",
                "url": "https://yourneworg.com/"
            }
        }
    }

    ```
6. **Validate your JSON:** Double-check your syntax. Missing commas, quotes, or brackets will make the JSON invalid. You can use an online [JSON validator to check your changes](https://jsonlint.com/) before committing if you're unsure.

### **Step 4: Propose Changes (Commit)**

1. Once you've added your entry and verified the JSON is correct, scroll down below the file editor.
2. You'll see a section titled "**Propose changes**" (if you forked) or "**Commit changes**" (if you have write access and are working on a branch).
3. Enter a concise and descriptive **commit message**. For example: `feat: Add [Your Organization Name] to LEF Trusted Issuer Registry`
4. You can add an optional extended description if needed.
5. If you forked, GitHub will typically select "Create a new branch for this commit and start a pull request." This is good. Give your branch a descriptive name (e.g., `add-[your-org-name]-to-registry`).
6. Click the green "**Propose changes**" or "**Commit changes**" button.

### **Step 5: Open a Pull Request**

If you forked and created a new branch, GitHub will usually take you to a page to "Open a pull request." If not, navigate to your fork of the `learningeconomy/LearnCard` repository, select your new branch, and click the "Contribute" button, then "Open pull request."

1. **Base Repository/Branch:** Ensure the base repository is `learningeconomy/LearnCard` and the base branch is `main`.
2. **Head Repository/Branch:** Ensure this is your fork and the branch where you made your changes.
3. **Title:** The PR title should be clear, similar to your commit message (e.g., `Add [Your Organization Name] to LEF Trusted Issuer Registry`).
4.  **Description:** This is crucial. **Please use the template below** to provide all necessary information for the review team. Copy and paste this template into the PR description box and fill in your details:

    ```markdown
    ### Organization Information

    * **Official Organization Name:** [Your Full Official Organization Name]
    * **Organization Website:** [Link to your organization's primary website]
    * **Organization Location:** [City, State/Region, Country]
    * **Primary Contact for this Request (GitHub Username or Email):** [@your-github-username or your@email.com]

    ### DID Information

    * **DID to be Added to Registry:** `YOUR_ORGANIZATIONS_DID_HERE` 
        *(Please ensure this is the exact DID you added to registry.json)*

    ### Purpose & Governance

    * **Brief Description of Organization:** [Provide a 1-2 sentence description of your organization and its mission.]
    * **Reason for Joining the Registry / Role in Credential Ecosystem:** [Explain why your organization issues credentials and wishes to be recognized as a trusted issuer. What types of credentials will you issue?]
    * **(Optional) Link to Governance Document / Public Issuer Statement:** [If you have a public document outlining your credentialing policies, or a statement about your role as an issuer, please link it here.]

    ### Verification

    * [ ] I have verified that the DID provided is correct and is controlled by my organization.
    * [ ] I have verified that the information added to `registry.json` is accurate and the JSON format is valid.
    * [ ] I understand that this PR will be reviewed by the Learning Economy Foundation team and inclusion is subject to their approval based on the registry's governance.

    ### Additional Notes (Optional)

    [Any other relevant information for the reviewers.]

    ```

### **Step 6: Submit the Pull Request**

* Review your PR details one last time.
* Click the green "**Create pull request**" button.

### What Happens Next?

1. **Review:** Your Pull Request will be reviewed by members of the Learning Economy Foundation team. They may ask questions or request clarifications via comments on the PR.
2. **Discussion:** Please monitor your PR for any feedback and respond promptly.
3. **Approval & Merge:** If your submission meets the criteria and all information is verified, your PR will be approved and merged. Your organization will then be part of the LEF Member Trusted Issuer Registry!
4. **Propagation:** Once merged, it may take some time for applications and services consuming the registry to pick up the latest version.

### **Important Considerations:**

* **JSON Validity:** The most common issue is invalid JSON. Please double-check your syntax, especially commas and quotes.
* **Accuracy:** Ensure all provided information, especially your DID and website URL, is accurate.
* **Patience:** The review process may take some time. Your cooperation in providing clear information will help expedite it.

Thank you for your interest in becoming a trusted issuer in the LearnCard ecosystem! We look forward to your contribution.
