'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./vc-templates-plugin.cjs.production.min.cjs');
} else {
    module.exports = require('./vc-templates-plugin.cjs.development.cjs');
}
