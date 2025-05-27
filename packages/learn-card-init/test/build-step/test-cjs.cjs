'use strict';

console.log(
    `Testing CJS import for @learncard/init (NODE_ENV: ${process.env.NODE_ENV || 'undefined'})`
);

try {
    const learnCardInit = require('../../dist/index.cjs');

    console.log('Successfully required @learncard/init');

    if (learnCardInit && typeof learnCardInit.initLearnCard === 'function') {
        console.log('Found expected export: initLearnCard');
    } else {
        console.error('Expected exports not found or not in the correct format!');
        console.log('Available exports:', Object.keys(learnCardInit));
    }

    // Test default export
    if (learnCardInit.default) {
        console.log('Found default export');
    }
} catch (error) {
    console.error('Error requiring or using @learncard/init (CJS):', error);
}
