'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./simple-signing-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./simple-signing-plugin.cjs.development.cjs');
}
