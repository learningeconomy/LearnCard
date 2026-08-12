'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./encryption-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./encryption-plugin.cjs.development.cjs');
}
