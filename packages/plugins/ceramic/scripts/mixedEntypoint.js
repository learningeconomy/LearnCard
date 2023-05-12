'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./ceramic-plugin.cjs.production.min.js');
} else {
    module.exports = require('./ceramic-plugin.cjs.development.js');
}
