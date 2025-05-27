// /Users/jackson/Documents/Projects/LEStudios/LearnCard/packages/learn-card-init/test-cjs.cjs
'use strict';

console.log(
    `Testing CJS import for @learncard/init (NODE_ENV: ${process.env.NODE_ENV || 'undefined'})`
);

try {
    // We use a relative path here to ensure we're testing the local build.
    // In a real consuming package, it would be: const learnCardInit = require('@learncard/init');
    const learnCardInit = require('./dist/index.cjs');

    console.log('Successfully required @learncard/init');

    // Replace 'expectedExport1', 'expectedExport2' with actual named exports from your package
    // For example, if your @learncard/init exports a function like `initializeLearnCard`
    if (learnCardInit && typeof learnCardInit.initializeLearnCard === 'function') {
        console.log('Found expected export: initializeLearnCard');
        // You could even try calling a simple function if it doesn't have complex dependencies
        // learnCardInit.initializeLearnCard(); // Or a simpler test function
    } else {
        console.error('Expected exports not found or not in the correct format!');
        console.log('Available exports:', Object.keys(learnCardInit));
    }

    // If you have a default export (less common for CJS from ESM-first builds)
    // if (learnCardInit.default) {
    //     console.log('Found default export');
    // }
} catch (error) {
    console.error('Error requiring or using @learncard/init (CJS):', error);
}
