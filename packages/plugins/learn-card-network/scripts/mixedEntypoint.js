'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./lcn-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./lcn-plugin.cjs.development.cjs');
}
