'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./sd-jwt-vc-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./sd-jwt-vc-plugin.cjs.development.cjs');
}
