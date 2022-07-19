#! /usr/bin/env node
const [ , , arg] = process.argv;
require('../lib').lookpath(arg || '').then(found => {
    if (!found) throw new Error(`Not found: ${arg}`);
    console.log(found);
}).catch(err => {
    console.error(err.message);
    process.exit(1);
});