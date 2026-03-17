'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./ler-rs-plugin.cjs.production.min.js');
} else {
    module.exports = require('./ler-rs-plugin.cjs.development.js');
}
