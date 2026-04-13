'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./credential-library.cjs.production.min.js');
} else {
    module.exports = require('./credential-library.cjs.development.js');
}
