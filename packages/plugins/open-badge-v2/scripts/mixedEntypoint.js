'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./open-badge-v2-plugin.cjs.production.min.js');
} else {
    module.exports = require('./open-badge-v2-plugin.cjs.development.js');
}
