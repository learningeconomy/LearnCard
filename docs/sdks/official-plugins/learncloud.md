# LearnCloud

### Using the LearnCLoud Plugin

The LearnCloud Plugin (`@learncard/learn-cloud-plugin`) simplifies the process of interacting with the LearnCloud API by providing a set of convenient methods for managing credentials, presentations, and records. This guide will help you understand how to use this plugin in your application.

#### Installation

```bash
pnpm install @learncard/learn-cloud-plugin
```

#### Initialization

```javascript
import { initLearnCard } from '@learncard/init'
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

const learnCard = await initLearnCard({ seed, didkit });
```

#### Accessing Plugin Methods

Once you've initialized the LearnCloud Plugin, you can access the methods by calling the `read`, `store`, and `index` planes. For example, to get the current user's Credential Records, you can call:

```javascript
await learnCard.index.LearnCloud.get();
```

For a more detailed breakdown of how to use the [Read](/broken/pages/s13FerGAbkHnrN13v85i), [Store](/broken/pages/AacoBhj2Q6kUaK1EVNnj), and [Index](/broken/pages/plqXXrKGsTzgtcePKceH) Planes, see their respective pages.
