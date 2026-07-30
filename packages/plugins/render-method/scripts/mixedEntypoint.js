'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./render-method-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./render-method-plugin.cjs.development.cjs');
}
