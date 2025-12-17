'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./lca-api-plugin.cjs.production.min.js');
} else {
    module.exports = require('./lca-api-plugin.cjs.development.js');
}
