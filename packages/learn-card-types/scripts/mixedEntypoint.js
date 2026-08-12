'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./types.cjs.production.min.cjs');
} else {
    module.exports = require('./types.cjs.development.cjs');
}
