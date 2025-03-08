'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./simple-signing-client.cjs.production.min.js');
} else {
    module.exports = require('./simple-signing-client.cjs.development.js');
}
