'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./did-web-plugin.cjs.production.min.js');
} else {
    module.exports = require('./did-web-plugin.cjs.development.js');
}
