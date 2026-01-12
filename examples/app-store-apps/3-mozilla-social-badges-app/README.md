# Mozilla Social Badges

**Recognize and celebrate open web contributions through verifiable badges**

A modern web app powered by the LearnCard Partner Connect SDK that enables the Mozilla community to award and receive social badges for contributions to the open web.

## 🌟 Features

- **Issue Social Badges**: Recognize community members for their contributions
- **Boost Templates**: Pre-configured badge templates for common contributions
- **Mozilla Branding**: Clean, modern design aligned with Mozilla's visual identity
- **LearnCard Integration**: Powered by verifiable credentials and the open web
- **Zero Backend**: Static site with serverless functions

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and pnpm installed
- A LearnCard account (create one at [learncard.app](https://learncard.app))

### Installation

1. **Install dependencies** (from repository root):
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cd examples/app-store-apps/3-mozilla-social-badges-app
   cp .env.example .env
   ```

3. **Generate a secure issuer seed**:
   ```bash
   openssl rand -hex 32
   ```
   
   Add this to your `.env` file:
   ```
   LEARNCARD_ISSUER_SEED=your_generated_seed_here
   ```

4. **Start the development server**:
   ```bash
   pnpm run dev
   ```

5. **Open your browser** to `http://localhost:4321`

## 🎯 How It Works

### Social Boosting

Social Badges uses LearnCard's built-in boost feature to enable community recognition:

1. **Backend Setup** - Server automatically creates boost templates for all badge types
2. **Connect Wallet** - Community members log in with their LearnCard account
3. **Award Badges** - Click any badge to open LearnCard's boost interface
4. **Auto Admin** - First-time users are automatically granted admin access
5. **Instant Delivery** - Recipients receive verifiable credentials in their wallet

### Badge Templates

Six pre-configured Mozilla-themed badges:

- 🦊 **Firefox Champion** - Advocates for browser choice, privacy, and an open web
- 🌐 **Open Web Builder** - Contributes to open web standards and technologies
- 🛡️ **Privacy Guardian** - Champions privacy, security, and data protection
- 📚 **MDN Contributor** - Improves web documentation and learning resources
- 🤝 **Community Leader** - Builds and nurtures Mozilla communities worldwide
- 🎨 **Design Pioneer** - Creates beautiful, accessible web experiences

### Technical Flow

1. **Server initialization** creates boost templates using `@learncard/init`
2. **Frontend** loads templates and displays badge cards
3. **User authentication** via LearnCard Partner Connect SDK
4. **Badge awarding** uses `learnCard.sendBoost(boostUri)`
5. **Auto-provisioning** assigns admin rights on first award attempt

## 🔧 Technology Stack

- **Astro** - Modern static site framework with server actions
- **LearnCard Partner Connect SDK** - Frontend wallet integration
- **@learncard/init** - Backend credential issuance and boost management
- **Astro Actions** - Type-safe server-side API endpoints
- **Netlify** - Serverless deployment platform
- **Mozilla Design System** - Typography, colors, and branding

## 📖 Learn More

- [LearnCard Documentation](https://docs.learncard.com)
- [Partner Connect SDK Guide](https://docs.learncard.com/partner-connect)
- [Mozilla Design System](https://protocol.mozilla.org/)

## 🌍 About Mozilla Social Badges

Mozilla Social Badges is a demonstration of how verifiable credentials can power community recognition and reputation systems on the open web. By issuing badges as verifiable credentials, we ensure that:

- **You own your badges** - Not locked into any platform
- **Privacy-first** - Share what you want, when you want
- **Interoperable** - Work across apps and platforms
- **Verifiable** - Cryptographically signed and tamper-proof

## 📄 License

This example application is provided as-is for demonstration purposes.
