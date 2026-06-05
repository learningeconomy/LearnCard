'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./linked-claims-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./linked-claims-plugin.cjs.development.cjs');
}
