# What is LearnCard?

[**LearnCard**](https://www.learncard.com) lets you issue digital credentials — badges, certificates, achievements — that people truly own and can share anywhere. You can send a verifiable credential to any email address with [one API call](quick-start/your-first-integration.md); recipients claim it in seconds and it works across any system that speaks the same open standards.

Under the hood, LearnCard is an open-source wallet, SDK, and network built on [W3C Verifiable Credentials](core-concepts/credentials-and-data/verifiable-credentials-vcs.md) and [Decentralized Identifiers (DIDs)](core-concepts/identities-and-keys/decentralized-identifiers-dids.md) — but you don't need to know those standards to ship your first integration. (New terms? See the [Glossary](introduction/glossary.md).)

[**LearnCard**](https://www.learncard.com) is maintained by [**Learning Economy Foundation**](https://www.learningeconomy.io).&#x20;

---

### Why Use LearnCard?

- **Portable**: Credentials travel with the learner—not locked into one system.
- **Consent-Driven**: Learners control who sees their data, and when.
- **Open**: Built on interoperable, community-driven standards.
- **Developer-Friendly**: Plug in easily to existing apps with modern APIs and tools.

---

### What You Can Build With It

LearnCard is already used to:

- Issue and verify credentials (skills, achievements, badges)
- Build learner passports and skill profiles
- Power AI copilots and bots that adapt to learner data
- Create consent-based dashboards for families, schools, and career counselors
- Support interoperability across educational, employment, and credentialing platforms

---

### Docs Structure at a Glance

This documentation is organized around what you're trying to do:

- 🚀 **Start Here** — [What Do You Want to Build?](introduction/what-do-you-want-to-build.md) picks one of five integration paths; the [Quickstart](quick-start/your-first-integration.md) sends your first credential in ~15 lines of code.
- 🛠️ **Build** — outcome-driven guides and tutorials: [send & issue credentials](how-to-guides/send-credentials.md), [publish your app](how-to-guides/publish-your-app.md), [add LearnCard to your product](how-to-guides/connect-systems/README.md), [consent & guardianship](tutorials/create-a-consentflow.md), and [going deep on the SDK](how-to-guides/deploy-infrastructure/README.md).
- 🧠 **Understand** — the concepts behind it all: [credentials](core-concepts/credentials-and-data/README.md), [identities & keys](core-concepts/identities-and-keys/README.md), [consent](core-concepts/consent-and-permissions/README.md), [the network](core-concepts/network-and-interactions/README.md), and [architecture](core-concepts/architecture-and-principles/README.md).
- 📖 **Reference** — [which SDK do I need?](sdks/which-sdk.md), then full API docs for the [Wallet SDK](sdks/learncard-core/README.md), [Network API](sdks/learncard-network/README.md), [Storage API](sdks/learncloud-storage-api/README.md), [Partner Connect](sdks/partner-connect.md), [Embed SDK](sdks/embed-sdk.md), and [plugins](sdks/official-plugins/README.md).
- 📱 **Products** — the [apps built on LearnCard](apps/README.md): the [LearnCard App](apps/learn-card-app/README.md), [ScoutPass](apps/scouts/README.md), and [contributing](development/contributing.md).

If you're new, start with the [**Quickstart**](quick-start/your-first-integration.md).

---

### How to Implement LearnCard

1. **Pick your flow**: Issue credentials, verify them, or manage a user's wallet.
2. **Install the SDK**:
    ```bash
    npm install @learncard/init
    ```
3. **Use open standards**: LearnCard supports [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/), W3C Verifiable Credentials, and more.
4. **Scale up**: Add consent flows, network features, and advanced cryptography as needed.

Whether you're building a web app, mobile experience, backend service, or bot, LearnCard has the primitives and integrations to make it seamless.

---

### You're in Good Hands

This stack was built by developers, for developers. It supports open standards and real-world interoperability from day one. We’re glad you’re here—let’s build a more learner-friendly future together.

### Questions or Feedback?

The best way to start engaging in the community is to participate in our [Github Discussions](https://github.com/learningeconomy/LearnCard/discussions):&#x20;

- [Post a Feature Request ](https://github.com/learningeconomy/LearnCard/discussions/categories/feature-requests)💡
- [Ask for Help](https://github.com/learningeconomy/LearnCard/discussions/categories/help) 💖
- [Show off your project to the community!](https://github.com/learningeconomy/LearnCard/discussions/categories/show-and-tell) 🙌

Do you need custom development or technical support? Click [here](https://www.learningeconomy.io/contact), or send us an email at [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
