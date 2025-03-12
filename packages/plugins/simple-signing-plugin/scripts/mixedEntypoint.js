'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./simple-signing-plugin.cjs.production.min.js');
} else {
    module.exports = require('./simple-signing-plugin.cjs.development.js');
}
