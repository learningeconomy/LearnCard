'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./brain-client.cjs.production.min.js');
} else {
    module.exports = require('./brain-client.cjs.development.js');
}
