'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./chapi-plugin.cjs.production.min.js');
} else {
    module.exports = require('./chapi-plugin.cjs.development.js');
}
