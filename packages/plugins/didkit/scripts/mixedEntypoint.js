'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./didkit-plugin.cjs.production.min.js');
} else {
    module.exports = require('./didkit-plugin.cjs.development.js');
}
