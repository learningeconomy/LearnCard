'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./auth-types.cjs.production.min.js');
} else {
    module.exports = require('./auth-types.cjs.development.js');
}
