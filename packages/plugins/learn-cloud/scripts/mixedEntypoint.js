'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./learn-cloud-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./learn-cloud-plugin.cjs.development.cjs');
}
