'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dynamic-loader-plugin.cjs.production.min.js');
} else {
    module.exports = require('./dynamic-loader-plugin.cjs.development.js');
}
