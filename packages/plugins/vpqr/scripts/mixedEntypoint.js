'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./vpqr-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./vpqr-plugin.cjs.development.cjs');
}
