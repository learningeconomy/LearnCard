'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./openid4vc-plugin.cjs.production.min.js');
} else {
    module.exports = require('./openid4vc-plugin.cjs.development.js');
}
