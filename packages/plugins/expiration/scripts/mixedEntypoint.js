'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./expiration-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./expiration-plugin.cjs.development.cjs');
}
