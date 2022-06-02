'use strict'

if(process.env.NODE_ENV === 'production') {
    module.exports = require('./learn-card-types.cjs.production.min.js');
} else {
    module.exports = require('./learn-card-types.cjs.development.js');
}
