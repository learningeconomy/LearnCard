'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./vpqr-plugin.cjs.production.min.js');
} else {
    module.exports = require('./vpqr-plugin.cjs.development.js');
}
