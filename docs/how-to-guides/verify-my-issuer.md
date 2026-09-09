---
description: Add your organization to the LEF Trusted Issuer Registry.
---

# Verify My Issuer

Submit a pull request (PR) to add your organization's DID and details to the LEF Member Trusted Issuer Registry.

**Goal:** Add your organization's DID and information to `registry.json`.

**Who is this for?** Organizations that issue or plan to issue Verifiable Credentials and want to join the LEF registry.

{% hint style="info" %}
See [Trusted Issuer Registries](../core-concepts/identities-and-keys/trust-registries.md) for the underlying concepts.&#x20;
{% endhint %}

**What you'll need:**

- A **GitHub account**.
- Basic familiarity with **Git and GitHub Pull Requests**. GitHub provides a [pull request guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).
- Your organization's **official name**.
- Your organization's primary **website URL**.
- Your organization's **location** (City, State/Region, Country).
- The **Decentralized Identifier (DID)** your organization will use for issuing credentials (e.g., `did:web:yourdomain.com` or `did:key:z...`).
- A brief **description** of your organization and its role or purpose in issuing credentials.
- Optionally, a URL to your organization's **governance document** or public statement about its credentialing practices.
- A **contact person** (GitHub username or email) for any questions regarding your submission.

## Procedure: Adding Your Organization to the Registry

Submit your registry entry through GitHub:

### **Step 1: Prepare Your Organization's Information**

Gather the details listed above. Use the primary DID your organization will issue credentials with.

### **Step 2: Navigate to the Registry File on GitHub**

The registry is a JSON file in the LearnCard repository.

- Open [https://github.com/learningeconomy/LearnCard/blob/main/packages/learn-card-registries/trusted/registry.json](../../packages/learn-card-registries/trusted/registry.json).

### **Step 3: Edit the `registry.json` File**

1. On the GitHub page for `registry.json`, click the **pencil icon** (Edit this file) in the upper right corner of the file view.
    - Without write access, click **Fork this repository and propose changes**.
2. In the `registry` object, each key is an issuer DID and each value contains its details.
3. Add your organization within the `registry` object, preferably in DID alphabetical order.

    - Follow the existing JSON structure.
    - The key for your entry **must be your organization's DID**.
    - The value must be an object with `name`, `location`, and `url` keys.

    **Example Entry Structure:**

    ```json
    "YOUR_ORGANIZATIONS_DID_HERE": {
        "name": "Your Official Organization Name",
        "location": "City, State/Region, Country",
        "url": "https://yourorganization.com/"
    }
    ```

4. Add a comma (`,`) after the preceding entry if yours is not last.

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

5. Add your entry:

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

6. **Validate your JSON:** Missing commas, quotes, or brackets make it invalid. Check it with a [JSON validator](https://jsonlint.com/) before committing.

### **Step 4: Propose Changes (Commit)**

1. After validating the JSON, scroll below the file editor.
2. Find **Propose changes** (for a fork) or **Commit changes** (with write access).
3. Enter a commit message, such as `feat: Add [Your Organization Name] to LEF Trusted Issuer Registry`.
4. Add an extended description if needed.
5. For a fork, select **Create a new branch for this commit and start a pull request** and name the branch (for example, `add-[your-org-name]-to-registry`).
6. Click the green "**Propose changes**" or "**Commit changes**" button.

### **Step 5: Open a Pull Request**

GitHub usually opens the pull request page after you create the branch. Otherwise, open your fork of `learningeconomy/LearnCard`, select the branch, then click **Contribute** and **Open pull request**.

1. **Base Repository/Branch:** Set the base repository to `learningeconomy/LearnCard` and branch to `main`.
2. **Head Repository/Branch:** Select your fork and branch.
3. **Title:** The PR title should be clear, similar to your commit message (e.g., `Add [Your Organization Name] to LEF Trusted Issuer Registry`).
4. **Description:** Copy the template below into the PR description and fill in your details:

    ```markdown
    ### Organization Information

    - **Official Organization Name:** [Your Full Official Organization Name]
    - **Organization Website:** [Link to your organization's primary website]
    - **Organization Location:** [City, State/Region, Country]
    - **Primary Contact for this Request (GitHub Username or Email):** [@your-github-username or your@email.com]

    ### DID Information

    - **DID to be Added to Registry:** `YOUR_ORGANIZATIONS_DID_HERE`
      _(Please ensure this is the exact DID you added to registry.json)_

    ### Purpose & Governance

    - **Brief Description of Organization:** [Provide a 1-2 sentence description of your organization and its mission.]
    - **Reason for Joining the Registry / Role in Credential Ecosystem:** [Explain why your organization issues credentials and wishes to be recognized as a trusted issuer. What types of credentials will you issue?]
    - **(Optional) Link to Governance Document / Public Issuer Statement:** [If you have a public document outlining your credentialing policies, or a statement about your role as an issuer, please link it here.]

    ### Verification

    - [ ] I have verified that the DID provided is correct and is controlled by my organization.
    - [ ] I have verified that the information added to `registry.json` is accurate and the JSON format is valid.
    - [ ] I understand that this PR will be reviewed by the Learning Economy Foundation team and inclusion is subject to their approval based on the registry's governance.

    ### Additional Notes (Optional)

    [Any other relevant information for the reviewers.]
    ```

### **Step 6: Submit the Pull Request**

- Review the PR details.
- Click the green "**Create pull request**" button.

### What Happens Next?

1. **Review:** The Learning Economy Foundation team reviews the PR and can request clarification in comments.
2. **Discussion:** Monitor the PR and respond to feedback.
3. **Approval & Merge:** Approved submissions are merged into the LEF Member Trusted Issuer Registry.
4. **Propagation:** Applications and services update after they fetch the latest registry version.

### **Important Considerations:**

- **JSON Validity:** Check commas and quotes before submission.
- **Accuracy:** Verify your DID, website URL, and organization details.
- **Review time:** Respond to reviewer questions to avoid delays.
