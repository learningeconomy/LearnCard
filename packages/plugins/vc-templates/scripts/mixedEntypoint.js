'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./vc-templates-plugin.cjs.production.min.js');
} else {
    module.exports = require('./vc-templates-plugin.cjs.development.js');
}
