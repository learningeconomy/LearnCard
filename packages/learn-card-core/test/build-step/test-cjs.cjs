'use strict';

console.log(
    `Testing CJS import for @learncard/core (NODE_ENV: ${process.env.NODE_ENV || 'undefined'})`
);

try {
    const learnCardCore = require('../../dist/index.cjs');

    console.log('Successfully required @learncard/core');

    if (learnCardCore && typeof learnCardCore.generateLearnCard === 'function') {
        console.log('Found expected export: generateLearnCard');
    } else {
        console.error('Expected exports not found or not in the correct format!');
        console.log('Available exports:', Object.keys(learnCardCore));
    }

    // Test default export
    if (learnCardCore.default) {
        console.log('Found default export');
    }
} catch (error) {
    console.error('Error requiring or using @learncard/core (CJS):', error);
}
