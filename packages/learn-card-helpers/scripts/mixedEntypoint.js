'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./helpers.cjs.production.min.js');
} else {
  module.exports = require('./helpers.cjs.development.js');
}
