'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./crypto-plugin.cjs.production.min.js');
} else {
    module.exports = require('./crypto-plugin.cjs.development.js');
}
