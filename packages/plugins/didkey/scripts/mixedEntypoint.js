'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./didkey-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./didkey-plugin.cjs.development.cjs');
}
