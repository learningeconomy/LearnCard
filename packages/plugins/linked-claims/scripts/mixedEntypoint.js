'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./linked-claims-plugin.cjs.production.min.js');
} else {
    module.exports = require('./linked-claims-plugin.cjs.development.js');
}
