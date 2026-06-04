'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./idx-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./idx-plugin.cjs.development.cjs');
}
