# JavaScript APG

## What's New

`apg-js` obsoletes `apg-js2`, `apg-js2-lib`, `apg-js2-exp`, `apg-js2-api`, `apg-conv` and `apg-conv-api`. It changes them in two significant ways.

- It fixes a major problem in the attributes algorithm. Previous versions could fail on large grammars with many or large sets of mutually-recursive rules.
- It combines all of those packages into a single, easier to manage and maintain package.

In version 4.1.0 and higher, all files have been updated for compliance with ESLint using the airbnb + prettier configurations.
Use:

```
npm install --production apg-js
```

to prevent installation of ESLint development and configuration modules.

Version 4.1.2 simply replaces five instances of "module.exports = function exports(" with "module.exports = function exfn(". ESLint requires a name here but the name "exports" causes conflicts in some bundlers.

## Overview

`apg-js` is the JavaScript version of APG, an ABNF Parser Generator. APG generates recursive-descent parsers directly from a superset of [ABNF](https://tools.ietf.org/html/rfc5234) (SABNF). Visit the [APG](https://sabnf.com/`) website for a complete [overview](https://sabnf.com/overview/) of APG and SABNF.

## Documentation

This package is meant to assist other parsing applications and is normally not installed by itself, rather installed along with those other applications. For details and many examples of using of the libraries, both in node.js and browser applications, see `apg-js-examples` at [GitHub](https://github.com/ldthomas/apg-js-examples) or [npmjs](https://www.npmjs.com/package/apg-js-examples).
However, it does provide access to two, node.js applications, `apg` and `apg-conv`.

### Applications

`apg` is the parser generator. To see its usage run,

> `npm run apg`

`apg-conv` is a data conversion application. To see its usage run,

> `npm run apg-conv`

### Libraries

This package also contains four libraries that can be used in either node.js or browser applications.
The libraries depend upon one another and the dependency tree looks like so:

```
apg-exp
|- apg-api
|-|- apg-lib
|-|-|- apg-conv-api
```

Each of the libraries is bundled for browser use along with some special styles.
Each bundle contains all of its dependencies explicitly. That is, if a browser application needs both `apg-api` and `apg-lib`, only the `apg-api` bundle need be scripted into the page.

The library and css bundles are in the `./dist` directory.

```
./dist/apg-exp-bundle.js
./dist/apg-api-bundle.js
./dist/apg-lib-bundle.js
./dist/apg-conv-api-bundle.js
./dist/apg-lib-bundle.css
```

The bundles can all be regenerated with:

```
npm install -g browserify@17.0.0
npm install -g minify@7.0.1
npm install -g less@4.1.1
npm run bundle-apg-conv-api
npm run bundle-apg-lib
npm run bundle-apg-api
npm run bundle-apg-exp
npm run bundle-apg-lib-css
```

### Code Documentation

The code documentation is in [docco](http://ashkenas.com/docco/) format and can be generated with:

```
npm install -g docco@0.8.1
./bin/docco-gen.sh
```

(Higher versions of docco may work, but some lower versions definitely do not.)
The documentation is then at `./docs/index.html` or see it [here](https://sabnf.com/docs/apg-js/) at the [APG](https://sabnf.com/) website.
