'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./vc-api-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./vc-api-plugin.cjs.development.cjs');
}
