'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./ethereum-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./ethereum-plugin.cjs.development.cjs');
}
