'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./holder-continuity.cjs.production.min.js');
} else {
    module.exports = require('./holder-continuity.cjs.development.js');
}
