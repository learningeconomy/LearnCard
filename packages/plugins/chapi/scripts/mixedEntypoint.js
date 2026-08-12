'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./chapi-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./chapi-plugin.cjs.development.cjs');
}
