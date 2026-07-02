# Setup & Prerequisites

Welcome! This guide covers the essential setup required to start building with **LearnCard**. Following these steps will get your environment ready for our Quick Start and tutorials.

---

### 1. 🧭 Introduction

This guide will help you:

-   Set up your development environment
-   Install core SDKs and tools
-   Verify everything is working before your first credential issuance

> **Assumed Knowledge:**\
> You should be familiar with:
>
> -   Basic terminal/command line use
> -   JavaScript or TypeScript
> -   Package managers like npm, yarn, or Bun

All examples use modern JavaScript and run on Node.js.

---

### 2. 🖥️ System Requirements

#### ✅ Supported OS

-   **macOS** (M1/M2/M3+ supported)
-   **Windows** (Use [**WSL**](https://learn.microsoft.com/en-us/windows/wsl/install) for best results)
-   **Linux** (Ubuntu LTS recommended)

#### 🔧 Node.js + npm/yarn

-   Required version: **Node.js v18.x or v20.x**
-   Node.js includes npm by default.

📥 [Download Node.js](https://nodejs.org/)

**🔎 Verify:**

```bash
node -v
npm -v
# or if using yarn
yarn -v
```

#### 🔧 Git

Git is required for cloning repositories and managing code.

📥 [Download Git](https://git-scm.com/downloads)

**🔎 Verify:**

```bash
git --version
```

---

### 3. 👤 Account Setup (Optional)

#### Developer Account

You **do not need** a developer account to complete the Quick Start.

You'll be using local/demo network capabilities for your first integration. For live network use later, you can create a developer profile.

#### API Keys

Not required for Quick Start.

> You’ll need them later for:
>
> -   Live network integrations
> -   Custom signing authorities
> -   Auth-granted service access

---

### 4. 📦 Install the Wallet SDK

To get started with the [LearnCard Wallet SDK](../sdks/learncard-core/):

```bash
# Using npm
npm install @learncard/init

# Using yarn
yarn add @learncard/init

# Using Bun
bun add @learncard/init
```

This installs the essential module to initialize LearnCard

---

### 5. 🔧 Install Essential Tools (Optional for Quick Start)

#### LearnCard CLI (Optional)

If you want to interactively explore wallet actions via terminal:

```bash
npx @learncard/cli
```

This launches an interactive REPL where you can issue credentials, verify them, and explore the SDK.

→ See [CLI Documentation](../sdks/learncard-cli.md)

#### Seed Phrases

You **don’t need** an external wallet for Quick Start. LearnCard uses secure, deterministic wallets derived from seed phrases. You’ll use an environment variable (`SECURE_SEED`) for your first script.

---

### 6. 💡 Recommended Tools

#### Code Editor

We recommend [Visual Studio Code](https://code.visualstudio.com/)

#### Helpful Extensions:

-   **ESLint** – Code quality
-   **Prettier** – Auto-formatting
-   **dotenv** – Recognizes environment variables in `.env` files

---

### 7. ✅ Check Your Setup

Run the following commands to confirm everything is ready:

```bash
# Verify Node + package manager
node -v
npm -v
# or yarn -v / bun -v

# Verify Git
git --version

# (Optional) Launch CLI
npx @learncard/cli
```

Need help? Visit our [Troubleshooting Guide ](../sdks/learncard-core/troubleshooting-guide.md)or join the Community for support.

---

### 8. 🚀 Next Steps

You’re ready to go!

👉 **Proceed to the** [**Quick Start: Issue Your First Digital Badge →**](your-first-integration.md)
