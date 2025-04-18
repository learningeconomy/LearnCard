'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./claimable-boosts-plugin.cjs.production.min.js');
} else {
    module.exports = require('./claimable-boosts-plugin.cjs.development.js');
}
