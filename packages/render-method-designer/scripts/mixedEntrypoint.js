'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./render-method-designer.cjs.production.min.js');
} else {
    module.exports = require('./render-method-designer.cjs.development.js');
}
