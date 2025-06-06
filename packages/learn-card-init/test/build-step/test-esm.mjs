// /Users/jackson/Documents/Projects/LEStudios/LearnCard/packages/learn-card-init/test-esm.mjs
console.log('Testing ESM import for @learncard/init');

try {
    // We use a relative path here to ensure we're testing the local build.
    // In a real consuming package, it would be: import { initLearnCard } from '@learncard/init';
    const { initLearnCard } = await import('../../dist/init.esm.js');

    console.log('Successfully imported from @learncard/init');

    if (typeof initLearnCard === 'function') {
        console.log('Found expected export: initLearnCard');
        // learnCardInit.initLearnCard(); // Or a simpler test function
    } else {
        console.error('Expected export "initLearnCard" not found or not a function!');
    }

    // Test other named exports if you have them
    // if (typeof anotherExport === '...') {
    //     console.log('Found expected export: anotherExport');
    // }
} catch (error) {
    console.error('Error importing or using @learncard/init (ESM):', error);
}
