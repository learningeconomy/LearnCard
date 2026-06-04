'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./didkit-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./didkit-plugin.cjs.development.cjs');
}
