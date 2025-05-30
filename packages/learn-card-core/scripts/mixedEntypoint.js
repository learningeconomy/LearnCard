'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./core.cjs.production.min.cjs');
} else {
    module.exports = require('./core.cjs.development.cjs');
}
