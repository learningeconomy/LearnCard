'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./init.cjs.production.min.cjs');
} else {
    module.exports = require('./init.cjs.development.cjs');
}
