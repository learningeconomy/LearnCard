'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./ceramic-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./ceramic-plugin.cjs.development.cjs');
}
