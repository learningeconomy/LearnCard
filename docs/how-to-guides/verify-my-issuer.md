---
description: Add your organization's DID to the LEF Trusted Issuer Registry so recipients see a verified issuer.
---

# Get Listed as a Trusted Issuer

The LEF Member Trusted Issuer Registry is the list LearnCard checks to decide whether an issuer is known. Listed issuers show as trusted in the LearnCard app instead of triggering an unverified-issuer notice, and listing also unlocks features reserved for registry members, such as sending credentials to phone numbers.

{% hint style="info" %}
**~10 min** · You have a GitHub account and your organization's DID.
{% endhint %}

## What to prepare

- **Official name** of your organization
- **Website URL**
- **Location** (City, State/Region, Country)
- **Issuing DID** (e.g., `did:web:yourdomain.com` or `did:key:z...`)
- **Description** of your organization and its credentialing role
- **Governance URL** (optional) linking to your credentialing practices
- **Contact person** (GitHub username or email)

## Add your entry

1. **Fork and edit:** Open [registry.json](https://github.com/learningeconomy/LearnCard/blob/main/packages/learn-card-registries/trusted/registry.json) on GitHub and click the pencil icon to fork and edit the file.
2. **Add your entry:** Insert your organization into the `registry` object (preferably in alphabetical order by DID). The key must be your exact issuing DID.

    ```json
    "did:web:yourneworg.com": {
        "name": "My New Organization",
        "location": "New City, New Country",
        "url": "https://yourneworg.com/"
    }
    ```

    _(Don't forget to add a comma after the preceding entry if yours is not last, and validate your JSON before committing.)_

3. **Open a PR:** Commit your changes to a new branch and open a pull request against `learningeconomy/LearnCard`. Include your description, governance URL, and contact info in the PR description. (See GitHub's [pull request guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) if you need help.)

## What happens next

1. **Review:** The Learning Economy Foundation team reviews the PR and may request clarification.
2. **Merge:** Approved submissions are merged into the `main` branch.
3. **Propagation:** Applications and services will recognize your DID as a trusted issuer once they fetch the latest registry version.

## Troubleshooting

| If…              | Then                                                                                                                   |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `Invalid JSON`   | Use a JSON validator to ensure you haven't missed any commas or quotes.                                                |
| `Merge conflict` | Another organization may have added an entry at the same time. Pull the latest `main` branch and resolve the conflict. |
| `PR checks fail` | Ensure your entry follows the exact schema required (DID as key, object with `name`, `location`, `url`).               |
