<p align="center">
  <img src="./assets/usage.gif" width="540" alt="Aqu usage" />
</p>

<h1 align="center">
  🌊 Aqu
</h1>

<p align="center">
  Powerful tool for easy <b>typescript/javascript</b> package development powered by <a href="https://github.com/evanw/esbuild#readme">esbuild</a> and <a href="https://github.com/timocov/dts-bundle-generator#readme">DTS bundle generator</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/aqu">
    <img  alt="package version" src="https://img.shields.io/npm/v/aqu">
  </a>
  <a href="https://www.npmjs.com/package/aqu">
    <img alt="package downloads" src="https://img.shields.io/npm/dw/aqu" />
  </a>
  <a href="https://www.npmjs.com/package/aqu">
    <img alt="vulnerabilities" src="https://img.shields.io/snyk/vulnerabilities/npm/aqu">
  </a>
  <a  href="https://github.com/ArtiomTr/aqu/issues">
    <img alt="issues" src="https://img.shields.io/github/issues/ArtiomTr/aqu" />
  </a>
</p>

<p align="center">
  <a href="#installation">Install</a> → 
  <a href="#create">Create package</a> → 
  <a href="#config">Customize</a> → 
  <a href="#develop">Develop</a> → 
  <a href="#publish">Publish</a>
</p>

---

## Inspiration

This package highly inspired by [TSDX](https://github.com/formium/tsdx), [Microbundle](https://github.com/developit/microbundle), [Create React Library](https://github.com/transitive-bullshit/create-react-library#readme).

## ✨ Features <a name="features"></a>

- One dependency for your code bundling 📦
- Supports vanilla JS, [TypeScript](https://github.com/microsoft/TypeScript#readme) and [React](https://github.com/facebook/react/#readme) ⚛
- No dealing with configurations (automatically generates CJS and esm outputs) ⚙
- Easy project creation, build, management 🔧
- Supports different package managers - [npm](https://github.com/npm/cli#readme), [yarn](https://github.com/yarnpkg/berry#readme) and [pnpm](https://github.com/pnpm/pnpm#readme) 🚀
- Fast, optimized builds thanks to [esbuild](https://github.com/evanw/esbuild#readme) ⏩
- Generates types, using common emit or [dts bundle](https://github.com/timocov/dts-bundle-generator#readme)
- Supports tree shaking 🗑
- Automatically configures [ESLint](https://github.com/eslint/eslint#readme), [Prettier](https://github.com/prettier/prettier#readme), [Jest](https://github.com/facebook/jest#readme) 📃
- Multiple entries and outputs 🤹‍♂️

## 🔨 Installation <a name="installation"></a>

You can create new package or integrate **aqu** into existing package. For package creation, we recommend to install aqu globally.

### 🌎 Global installation: <a name="global-installation"></a>

```sh
npm i -g aqu
```

Then, you can create new package:

```sh
aqu create <package>
```

### 🗾 Local installation:

```sh
npm i aqu -D
```

Then, add to your `package.json`:

```json
{
    ...
    "scripts": {
        "build": "aqu build",
        "start": "aqu watch",
        "test": "aqu test",
        "lint": "aqu lint"
    }
}
```

By default, **aqu** will search for `index` file in `src` or `lib` folder (available extensions: `.js`, `.jsx`, `.cjs`, `.mjs`, `.ts`, `.tsx`)

If this doesn't suit for your package, you can specify `source` property in your `package.json`:

```json
{
    ...
    "source": "my/entry.js"
}
```

Or, if you want to specify multiple entrypoints, you can do it in [aqu configuration file](#configuration).

## ⚒ New package <a name="create"></a>

For creating new package, we recommend to install [aqu globally](#global-installation).

In the shell, enter the command:

```sh
aqu create
```

Or using npx:

```sh
npx aqu create
```

Enter the details about your package and pick a template. Examples of generated projects you can find [here](https://github.com/ArtiomTr/aqu/tree/master/example)

If you don't want to enter all the information, you can automatically pick all defaults, by toggling `-y` flag:

```sh
npx aqu create <package> -y
```

## ⚙ Configuration <a name="config"></a>

**aqu** automatically creates optimal configuration for your package on-the-fly.

Default **aqu** configuration:

```js
var defaultConfig = {
  format: ['cjs', 'esm'], // will generate multiple outputs: one for cjs and one for esm
  cjsMode: 'mixed', // will generate separate files for development and production
  outdir: 'dist', // default output directory
  declaration: 'bundle', // will bundle declarations using https://github.com/timocov/dts-bundle-generator
  externalNodeModules: true, // automatically will mark all node_modules as external
  tsconfig: 'tsconfig.json', // default path to tsconfig
  incremental: true, // will build incrementally
  buildOptions: {}, // custom esbuild options
  watchOptions: {
    // chokidar watch options
    ignored: ['node_modules/**', 'dist/**', 'build/**', 'out/**'], // by default, will ignore those folders
    followSymlinks: false, // will not follow symlinks
  },
};
```

For input, **aqu** will search `index` file inside `lib` or `src` folder (available extensions for index: `.js`, `.jsx`, `.cjs`, `.mjs`, `.ts`, `.tsx`)

Also, **aqu** will read your `package.json` and take `source` option to determine entrypoint, and name for package's name.

You can specify your own **aqu** configuration. By default, these files will be read inside your working directory:

1. `aqu.config.js`
2. `aqu.config.cjs`
3. `aqu.config.mjs`
4. `aqu.config.ts`
5. `aqu.config.json`
6. `.aqurc`

If your configuration has different name, you can specify `--config` option for **aqu**. Example:

```sh
aqu build --config=myconfig.js
```

### 📃 Config schema

Configuration file can export one configuration, as well as array of configurations. For example:

```js
// aqu.config.js

// this works
module.exports = {
  input: './asdf.js',
};

// as well as this
module.exports = [
  {
    input: './asdf.js',
  },
  {
    input: './hello.js',
  },
];
```

Available configuration options:

1. [name](#name)
2. [input](#input)
3. [outdir](#outdir)
4. [outfile](#outfile)
5. [format](#format)
6. [cjsMode](#cjsMode)
7. [declaration](#declaration)
8. [tsconfig](#tsconfig)
9. [incremental](#incremental)
10. [externalNodeModules](#externalNodeModules)
11. [buildOptions](#buildOptions)
12. [watchOptions](#watchOptions)

#### name

type: `string`

Specify custom library name. By default, **aqu** will try to load package name from `package.json` in current working directory.

#### input

type: `string | string[]`

Your library entrypoints. For each entrypoint **aqu** will generate output files, using this configuration. Default: `index` file in `src` or `lib` directories.

#### outdir

type: `string`

Directory, where will all files be generaten. Default: `dist`

#### outfile

type: `string`

Output file. Do not works when configuration should generate multiple outputs (multiple formats or multiple entrypoints or `cjsMode: "multiple"`)

#### format

type: `Format | Format[]`

Output formats. Available formats: `cjs`, `esm`, `iife`. When `cjs` format picken, configuration option `cjsMode` works. Default `["cjs", "esm"]` For more information about formats, see [esbuild](https://github.com/evanw/esbuild#readme).

#### cjsMode

type: `"development" | "production" | "mixed"`

CommonJS generation mode. Works only when `format` includes `cjs`. If `production` - will generate minified bundle, `development` - normal development build, `mixed` - will generate both with one entrypoint - `index.js`. Default `"mixed"`

#### declaration

type: `DeclarationType`

Algorithm to emit declarations. Available options - `none`, `normal`, `bundle`. `none` - do not emit declarations, `normal` - default declaration emit (same as tsc does), `bundle` - generate declarations bundle using [dts-bundle-generator](https://github.com/timocov/dts-bundle-generator#readme). Default `bundle`.

#### tsconfig

type: `string`

Path to tsconfig. Default `join(process.cwd(), "tsconfig.json")`.

#### incremental

type: `boolean`

Build incrementally. Default `true`. For more information, see [esbuild](https://github.com/evanw/esbuild#readme).

#### externalNodeModules

type: `boolean`

Should exclude node_modules packages from bundle? Default `true`.

#### buildOptions

type: `ESBuildOptions`

Specify custom [esbuild options](https://esbuild.github.io/api/#simple-options).

#### watchOptions

type: `ChokidarOptions`

Specify custom [chokidar watch options](https://github.com/paulmillr/chokidar#readme).

### Other configurations

**aqu** creates default configs for [ESLint](https://github.com/eslint/eslint#readme), [Prettier](https://github.com/prettier/prettier#readme), [Jest](https://github.com/facebook/jest#readme). If you don't like the defaults, you can create your own configuration and override all options.

## 🔧 Package development <a name="develop"></a>

**aqu** makes your life easier. It automatically handles Jest, ESlint, Prettier, ESBuild and typings emit.

### build

Run command to build your package.

Usage:

```sh
aqu build
```

### watch

Watch your files and automatically rebuild project

Usage:

```sh
aqu watch
```

### lint

Lint files using ESLint.

Usage:

```sh
aqu lint
```

### test

Run jest. Passes all rest arguments to jest.

Usage:

```sh
aqu test.
```

## ✨ Publishing your package <a name="publish"></a>

We highly recommend to use [np](https://github.com/sindresorhus/np#readme) for your package publishing.

If you have created your package using `aqu create`, then you can just run:

```sh
npm run publish
```

Or

```sh
yarn publish
```

## Related

- [ESBuild](https://github.com/evanw/esbuild#readme) - An extremely fast JavaScript bundler
- [DTS Bundle generator](https://github.com/timocov/dts-bundle-generator) - Tool to generate a single bundle of dts
- [Microbundle](https://github.com/developit/microbundle) - Zero-configuration bundler for tiny JS libs, powered by Rollup.
- [TSDX](https://github.com/formium/tsdx) - Zero-config TypeScript package development
- [Create React Library](https://github.com/transitive-bullshit/create-react-library#readme) - CLI for easily bootstrapping modern react libraries

## License

MIT © [Artiom Tretjakovas](https://github.com/ArtiomTr)
