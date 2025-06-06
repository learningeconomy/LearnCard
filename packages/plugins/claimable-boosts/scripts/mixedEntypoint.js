'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./claimable-boosts-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./claimable-boosts-plugin.cjs.development.cjs');
}
