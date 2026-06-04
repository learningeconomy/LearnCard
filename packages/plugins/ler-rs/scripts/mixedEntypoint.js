'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./ler-rs-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./ler-rs-plugin.cjs.development.cjs');
}
