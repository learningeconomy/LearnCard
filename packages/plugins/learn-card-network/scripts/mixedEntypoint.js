'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./lcn-plugin.cjs.production.min.js');
} else {
    module.exports = require('./lcn-plugin.cjs.development.js');
}
