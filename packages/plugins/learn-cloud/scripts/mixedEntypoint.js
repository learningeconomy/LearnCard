'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./learn-cloud-plugin.cjs.production.min.js');
} else {
    module.exports = require('./learn-cloud-plugin.cjs.development.js');
}
