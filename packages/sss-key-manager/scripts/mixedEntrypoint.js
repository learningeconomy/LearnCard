'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./sss-key-manager.cjs.production.min.js');
} else {
    module.exports = require('./sss-key-manager.cjs.development.js');
}
