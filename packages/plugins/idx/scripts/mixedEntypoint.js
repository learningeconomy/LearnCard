'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./idx-plugin.cjs.production.min.js');
} else {
    module.exports = require('./idx-plugin.cjs.development.js');
}
