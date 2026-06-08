'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./lca-api-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./lca-api-plugin.cjs.development.cjs');
}
