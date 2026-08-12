'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./did-web-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./did-web-plugin.cjs.development.cjs');
}
