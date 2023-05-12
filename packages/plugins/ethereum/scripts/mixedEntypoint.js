'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./ethereum-plugin.cjs.production.min.js');
} else {
    module.exports = require('./ethereum-plugin.cjs.development.js');
}
