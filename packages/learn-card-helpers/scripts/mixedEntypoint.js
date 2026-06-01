'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./helpers.cjs.production.min.cjs');
} else {
  module.exports = require('./helpers.cjs.development.cjs');
}
