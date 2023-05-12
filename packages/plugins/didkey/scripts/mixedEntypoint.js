'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./didkey-plugin.cjs.production.min.js');
} else {
    module.exports = require('./didkey-plugin.cjs.development.js');
}
