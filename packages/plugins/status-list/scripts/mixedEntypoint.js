'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./status-list-plugin.cjs.production.min.js');
} else {
    module.exports = require('./status-list-plugin.cjs.development.js');
}
