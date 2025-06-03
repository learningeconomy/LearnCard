// /Users/jackson/Documents/Projects/LEStudios/LearnCard/packages/learn-card-init/test-types.ts

// This import should resolve to your local package's types if your tsconfig is set up
// or if you're testing in a way that mimics a consumer.
// For a quick local check, you might point directly to the built types,
// but ideally, you'd test this in a separate project that `npm link`s this one.

// Assuming your package is linked or you are in a context where '@learncard/init' resolves
// to the current package. For a direct check:
import { initializeLearnCard } from '../../dist/index.d.ts'; // or just './dist' if index.d.ts exports everything

// Check if the types are recognized
// const result = initializeLearnCard({ /* options if any */ }); // Example usage

// If initializeLearnCard is a function, this should not cause a type error:
let myFunc: typeof initializeLearnCard;

console.log('TypeScript can see the exports (compile-time check).');
