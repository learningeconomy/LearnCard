'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./learn-card-plugin.cjs.production.min.js');
} else {
    module.exports = require('./learn-card-plugin.cjs.development.js');
}
