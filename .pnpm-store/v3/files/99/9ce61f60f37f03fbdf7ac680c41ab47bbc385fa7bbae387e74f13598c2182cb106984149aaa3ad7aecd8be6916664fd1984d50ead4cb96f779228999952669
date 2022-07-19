'use strict';

var path = require('path');
var pluginutils = require('@rollup/pluginutils');
var cssnano = require('cssnano');
var PQueue = require('p-queue');
var fs = require('fs-extra');
var postcss = require('postcss');
var sourceMapJs = require('source-map-js');
var resolver = require('resolve');
var crypto = require('crypto');
var cosmiconfig = require('cosmiconfig');
var valueParser = require('postcss-value-parser');
var queryString = require('query-string');
var mimeTypes = require('mime-types');
var modulesValues = require('postcss-modules-values');
var localByDefault = require('postcss-modules-local-by-default');
var extractImports = require('postcss-modules-extract-imports');
var modulesScope = require('postcss-modules-scope');
var icssUtils = require('icss-utils');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var cssnano__default = /*#__PURE__*/_interopDefaultLegacy(cssnano);
var PQueue__default = /*#__PURE__*/_interopDefaultLegacy(PQueue);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var resolver__default = /*#__PURE__*/_interopDefaultLegacy(resolver);
var valueParser__default = /*#__PURE__*/_interopDefaultLegacy(valueParser);
var modulesValues__default = /*#__PURE__*/_interopDefaultLegacy(modulesValues);
var localByDefault__default = /*#__PURE__*/_interopDefaultLegacy(localByDefault);
var extractImports__default = /*#__PURE__*/_interopDefaultLegacy(extractImports);
var modulesScope__default = /*#__PURE__*/_interopDefaultLegacy(modulesScope);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const isAbsolutePath = path => /^(?:\/|(?:[A-Za-z]:)?[/\\|])/.test(path);
const isRelativePath = path => /^\.?\.[/\\]/.test(path);
function normalizePath(...paths) {
  const f = path__default["default"].join(...paths).replace(/\\/g, "/");
  if (/^\.[/\\]/.test(paths[0])) return `./${f}`;
  return f;
}
const resolvePath = (...paths) => normalizePath(path__default["default"].resolve(...paths));
const relativePath = (from, to) => normalizePath(path__default["default"].relative(from, to));
const humanlizePath = file => relativePath(process.cwd(), file);

const hashRe = /\[hash(?::(\d+))?]/;
const firstExtRe = /(?<!^|[/\\])(\.[^\s.]+)/i;
const dataURIRe = /data:[^\n\r;]+?(?:;charset=[^\n\r;]+?)?;base64,([\d+/A-Za-z]+={0,2})/;

const mapBlockRe = /(?:\n|\r\n)?\/\*[#*@]+?\s*?sourceMappingURL\s*?=\s*?(\S+)\s*?\*+?\//gm;
const mapLineRe = /(?:\n|\r\n)?\/\/[#@]+?\s*?sourceMappingURL\s*?=\s*?(\S+)\s*?$/gm;
async function getMap(code, id) {
  var _ref, _mapBlockRe$exec, _dataURIRe$exec;

  const [, data] = (_ref = (_mapBlockRe$exec = mapBlockRe.exec(code)) !== null && _mapBlockRe$exec !== void 0 ? _mapBlockRe$exec : mapLineRe.exec(code)) !== null && _ref !== void 0 ? _ref : [];
  if (!data) return;
  const [, uriMap] = (_dataURIRe$exec = dataURIRe.exec(data)) !== null && _dataURIRe$exec !== void 0 ? _dataURIRe$exec : [];
  if (uriMap) return Buffer.from(uriMap, "base64").toString();
  if (!id) throw new Error("Extracted map detected, but no ID is provided");
  const mapFileName = path__default["default"].resolve(path__default["default"].dirname(id), data);
  const exists = await fs__default["default"].pathExists(mapFileName);
  if (!exists) return;
  return fs__default["default"].readFile(mapFileName, "utf8");
}
const stripMap = code => code.replace(mapBlockRe, "").replace(mapLineRe, "");

class MapModifier {
  constructor(map) {
    _defineProperty(this, "map", void 0);

    if (typeof map === "string") try {
      this.map = JSON.parse(map);
    } catch {
      /* noop */
    } else this.map = map;
  }

  modify(f) {
    if (!this.map) return this;
    f(this.map);
    return this;
  }

  modifySources(op) {
    if (!this.map) return this;
    if (this.map.sources) this.map.sources = this.map.sources.map(s => op(s));
    return this;
  }

  resolve(dir = process.cwd()) {
    return this.modifySources(source => {
      if (source === "<no source>") return source;
      return resolvePath(dir, source);
    });
  }

  relative(dir = process.cwd()) {
    return this.modifySources(source => {
      if (source === "<no source>") return source;
      if (isAbsolutePath(source)) return relativePath(dir, source);
      return normalizePath(source);
    });
  }

  toObject() {
    return this.map;
  }

  toString() {
    if (!this.map) return this.map;
    return JSON.stringify(this.map);
  }

  toConsumer() {
    if (!this.map) return this.map;
    return new sourceMapJs.SourceMapConsumer(this.map);
  }

  toCommentData() {
    const map = this.toString();
    if (!map) return "";
    const sourceMapData = Buffer.from(map).toString("base64");
    return `\n/*# sourceMappingURL=data:application/json;base64,${sourceMapData} */`;
  }

  toCommentFile(fileName) {
    if (!this.map) return "";
    return `\n/*# sourceMappingURL=${fileName} */`;
  }

}

const mm = map => new MapModifier(map);

var arrayFmt = (arr => arr.map((id, i, arr) => {
  const fmt = `\`${id}\``;

  switch (i) {
    case arr.length - 1:
      return `or ${fmt}`;

    case arr.length - 2:
      return fmt;

    default:
      return `${fmt},`;
  }
}).join(" "));

const defaultOpts = {
  caller: "Resolver",
  basedirs: [__dirname],
  extensions: [".mjs", ".js", ".json"],
  preserveSymlinks: true,

  packageFilter(pkg) {
    if (pkg.module) pkg.main = pkg.module;
    if (pkg.style) pkg.main = pkg.style;
    return pkg;
  }

};

const resolverAsync = async (id, options = {}) => new Promise(resolve => resolver__default["default"](id, options, (_, res) => resolve(res)));

async function resolveAsync(ids, userOpts) {
  const options = { ...defaultOpts,
    ...userOpts
  };

  for await (const basedir of options.basedirs) {
    const opts = { ...options,
      basedir,
      basedirs: undefined,
      caller: undefined
    };

    for await (const id of ids) {
      const resolved = await resolverAsync(id, opts);
      if (resolved) return resolved;
    }
  }

  throw new Error(`${options.caller} could not resolve ${arrayFmt(ids)}`);
}

const resolverSync = (id, options = {}) => {
  try {
    return resolver.sync(id, options);
  } catch {
    return;
  }
};

function resolveSync(ids, userOpts) {
  const options = { ...defaultOpts,
    ...userOpts
  };

  for (const basedir of options.basedirs) {
    const opts = { ...options,
      basedir,
      basedirs: undefined,
      caller: undefined
    };

    for (const id of ids) {
      const resolved = resolverSync(id, opts);
      if (resolved) return resolved;
    }
  }

  throw new Error(`${options.caller} could not resolve ${arrayFmt(ids)}`);
}

var hasher = (data => crypto.createHash("sha256").update(data).digest("hex"));

var safeId = ((id, ...salt) => {
  const hash = hasher([id, "0iOXBLSx", ...salt].join(":")).slice(0, 8);
  return pluginutils.makeLegalIdentifier(`${id}_${hash}`);
});

const loaded = {};
const options = {
  caller: "Module loader",
  basedirs: [process.cwd()],
  extensions: [".js", ".mjs", ".json"],
  preserveSymlinks: false,
  packageFilter: pkg => pkg
};
function loadModule (moduleId) {
  if (loaded[moduleId]) return loaded[moduleId];
  if (loaded[moduleId] === null) return;

  try {
    loaded[moduleId] = require(resolveSync([moduleId, `./${moduleId}`], options));
  } catch {
    loaded[moduleId] = null;
    return;
  }

  return loaded[moduleId];
}

function inferOption(option, defaultValue) {
  if (typeof option === "boolean") return option && {};
  if (typeof option === "object") return option;
  return defaultValue;
}
const modes = ["inject", "extract", "emit"];
const modesFmt = arrayFmt(modes);
function inferModeOption(mode) {
  var _m$, _m$2;

  const m = Array.isArray(mode) ? mode : [mode];
  if (m[0] && !modes.includes(m[0])) throw new Error(`Incorrect mode provided, allowed modes are ${modesFmt}`);
  return {
    inject: (!m[0] || m[0] === "inject") && ((_m$ = m[1]) !== null && _m$ !== void 0 ? _m$ : true),
    extract: m[0] === "extract" && ((_m$2 = m[1]) !== null && _m$2 !== void 0 ? _m$2 : true),
    emit: m[0] === "emit"
  };
}
function inferSourceMapOption(sourceMap) {
  const sm = Array.isArray(sourceMap) ? sourceMap : [sourceMap];
  if (!sm[0]) return false;
  return {
    content: true,
    ...sm[1],
    inline: sm[0] === "inline"
  };
}
function inferHandlerOption(option, alias) {
  const opt = inferOption(option, {});
  if (alias && typeof opt === "object" && !opt.alias) opt.alias = alias;
  return opt;
}
function ensureUseOption(opts) {
  var _opts$sass, _opts$less, _opts$stylus;

  const all = {
    sass: ["sass", (_opts$sass = opts.sass) !== null && _opts$sass !== void 0 ? _opts$sass : {}],
    less: ["less", (_opts$less = opts.less) !== null && _opts$less !== void 0 ? _opts$less : {}],
    stylus: ["stylus", (_opts$stylus = opts.stylus) !== null && _opts$stylus !== void 0 ? _opts$stylus : {}]
  };
  if (typeof opts.use === "undefined") return Object.values(all);else if (!Array.isArray(opts.use)) throw new TypeError("`use` option must be an array!");
  return opts.use.map(loader => {
    if (typeof loader !== "string") throw new TypeError("`use` option must be an array of strings!");
    return all[loader] || [loader, {}];
  });
}
function ensurePCSSOption(option, type) {
  if (typeof option !== "string") return option;
  const module = loadModule(option);
  if (!module) throw new Error(`Unable to load PostCSS ${type} \`${option}\``);
  return module;
}
function ensurePCSSPlugins(plugins) {
  if (typeof plugins === "undefined") return [];else if (typeof plugins !== "object") throw new TypeError("`plugins` option must be an array or an object!");
  const ps = [];

  for (const p of !Array.isArray(plugins) ? Object.entries(plugins) : plugins) {
    if (!p) continue;

    if (!Array.isArray(p)) {
      ps.push(ensurePCSSOption(p, "plugin"));
      continue;
    }

    const [plug, opts] = p;
    if (!opts) ps.push(ensurePCSSOption(plug, "plugin"));else ps.push(ensurePCSSOption(plug, "plugin")(opts));
  }

  return ps;
}

async function loadConfig (id, config) {
  var _process$env$NODE_ENV, _config$ctx;

  if (!config) return {
    plugins: [],
    options: {}
  };
  const {
    ext,
    dir,
    base
  } = path__default["default"].parse(id);
  const searchPath = config.path ? path__default["default"].resolve(config.path) : dir;
  const found = await cosmiconfig.cosmiconfig("postcss").search(searchPath);
  if (!found || found.isEmpty) return {
    plugins: [],
    options: {}
  };
  const {
    plugins,
    parser,
    syntax,
    stringifier
  } = typeof found.config === "function" ? found.config({
    cwd: process.cwd(),
    env: (_process$env$NODE_ENV = process.env["NODE_ENV"]) !== null && _process$env$NODE_ENV !== void 0 ? _process$env$NODE_ENV : "development",
    file: {
      extname: ext,
      dirname: dir,
      basename: base
    },
    options: (_config$ctx = config.ctx) !== null && _config$ctx !== void 0 ? _config$ctx : {}
  }) : found.config;
  const result = {
    plugins: ensurePCSSPlugins(plugins),
    options: {}
  };
  if (parser) result.options.parser = ensurePCSSOption(parser, "parser");
  if (syntax) result.options.syntax = ensurePCSSOption(syntax, "syntax");
  if (stringifier) result.options.stringifier = ensurePCSSOption(stringifier, "stringifier");
  return result;
}

const resolve$2 = async (inputUrl, basedir, extensions) => {
  const options = {
    caller: "@import resolver",
    basedirs: [basedir],
    extensions
  };
  const parseOptions = {
    parseFragmentIdentifier: true,
    sort: false,
    decode: false
  };
  const {
    url
  } = queryString.parseUrl(inputUrl, parseOptions);
  const from = await resolveAsync([url, `./${url}`], options);
  return {
    from,
    source: await fs__default["default"].readFile(from)
  };
};

const name$3 = "styles-import";
const extensionsDefault$1 = [".css", ".pcss", ".postcss", ".sss"];

const plugin$3 = (options = {}) => {
  var _options$resolve, _options$alias, _options$extensions;

  const resolve = (_options$resolve = options.resolve) !== null && _options$resolve !== void 0 ? _options$resolve : resolve$2;
  const alias = (_options$alias = options.alias) !== null && _options$alias !== void 0 ? _options$alias : {};
  const extensions = (_options$extensions = options.extensions) !== null && _options$extensions !== void 0 ? _options$extensions : extensionsDefault$1;
  return {
    postcssPlugin: name$3,

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async Once(css, {
      result: res
    }) {
      var _css$source;

      if (!((_css$source = css.source) !== null && _css$source !== void 0 && _css$source.input.file)) return;
      const opts = { ...res.opts
      };
      delete opts.map;
      const {
        file
      } = css.source.input;
      const importList = [];
      const basedir = path__default["default"].dirname(file);
      css.walkAtRules(/^import$/i, rule => {
        // Top level only
        if (rule.parent && rule.parent.type !== "root") {
          rule.warn(res, "`@import` should be top level");
          return;
        } // Child nodes should not exist


        if (rule.nodes) {
          rule.warn(res, "`@import` was not terminated correctly");
          return;
        }

        const [urlNode] = valueParser__default["default"](rule.params).nodes; // No URL detected

        if (!urlNode || urlNode.type !== "string" && urlNode.type !== "function") {
          rule.warn(res, `No URL in \`${rule.toString()}\``);
          return;
        }

        let url = "";

        if (urlNode.type === "string") {
          url = urlNode.value;
        } else if (urlNode.type === "function") {
          var _urlNode$nodes$;

          // Invalid function
          if (!/^url$/i.test(urlNode.value)) {
            rule.warn(res, `Invalid \`url\` function in \`${rule.toString()}\``);
            return;
          }

          const isString = ((_urlNode$nodes$ = urlNode.nodes[0]) === null || _urlNode$nodes$ === void 0 ? void 0 : _urlNode$nodes$.type) === "string";
          url = isString ? urlNode.nodes[0].value : valueParser__default["default"].stringify(urlNode.nodes);
        }

        url = url.replace(/^\s+|\s+$/g, ""); // Resolve aliases

        for (const [from, to] of Object.entries(alias)) {
          if (url !== from && !url.startsWith(`${from}/`)) continue;
          url = normalizePath(to) + url.slice(from.length);
        } // Empty URL


        if (url.length === 0) {
          rule.warn(res, `Empty URL in \`${rule.toString()}\``);
          return;
        } // Skip Web URLs


        if (!isAbsolutePath(url)) {
          try {
            new URL(url);
            return;
          } catch {// Is not a Web URL, continuing
          }
        }

        importList.push({
          rule,
          url
        });
      });

      for await (const {
        rule,
        url
      } of importList) {
        try {
          const {
            source,
            from
          } = await resolve(url, basedir, extensions);

          if (!(source instanceof Uint8Array) || typeof from !== "string") {
            rule.warn(res, `Incorrectly resolved \`@import\` in \`${rule.toString()}\``);
            continue;
          }

          if (normalizePath(from) === normalizePath(file)) {
            rule.warn(res, `\`@import\` loop in \`${rule.toString()}\``);
            continue;
          }

          const imported = await postcss__default["default"](plugin$3(options)).process(source, { ...opts,
            from
          });
          res.messages.push(...imported.messages, {
            plugin: name$3,
            type: "dependency",
            file: from
          });
          if (!imported.root) rule.remove();else rule.replaceWith(imported.root);
        } catch {
          rule.warn(res, `Unresolved \`@import\` in \`${rule.toString()}\``);
        }
      }
    }

  };
};

plugin$3.postcss = true;

const resolve$1 = async (inputUrl, basedir) => {
  const options = {
    caller: "URL resolver",
    basedirs: [basedir]
  };
  const parseOptions = {
    parseFragmentIdentifier: true,
    sort: false,
    decode: false
  };
  const {
    url,
    query,
    fragmentIdentifier
  } = queryString.parseUrl(inputUrl, parseOptions);
  const from = await resolveAsync([url, `./${url}`], options);
  const urlQuery = queryString.stringifyUrl({
    url: "",
    query,
    fragmentIdentifier
  }, parseOptions);
  return {
    from,
    source: await fs__default["default"].readFile(from),
    urlQuery
  };
};

var generateName = ((placeholder, file, source) => {
  const {
    dir,
    name,
    ext,
    base
  } = path__default["default"].parse(file);
  const hash = hasher(`${base}:${Buffer.from(source).toString()}`);
  const match = hashRe.exec(placeholder);
  const hashLen = match && Number.parseInt(match[1]);
  return placeholder.replace("[dir]", path__default["default"].basename(dir)).replace("[name]", name).replace("[extname]", ext).replace(".[ext]", ext).replace("[ext]", ext.slice(1)).replace(hashRe, hashLen ? hash.slice(0, hashLen) : hash.slice(0, 8));
});

const urlFuncRe = /^url$/i;
const imageSetFuncRe = /^(?:-webkit-)?image-set$/i;
const isDeclWithUrl = decl => /(?:url|(?:-webkit-)?image-set)\(/i.test(decl.value);
const walkUrls = (parsed, callback) => {
  parsed.walk(node => {
    if (node.type !== "function") return;

    if (urlFuncRe.test(node.value)) {
      const {
        nodes
      } = node;
      const [urlNode] = nodes;
      const url = (urlNode === null || urlNode === void 0 ? void 0 : urlNode.type) === "string" ? urlNode.value : valueParser__default["default"].stringify(nodes);
      callback(url.replace(/^\s+|\s+$/g, ""), urlNode);
      return;
    }

    if (imageSetFuncRe.test(node.value)) {
      for (const nNode of node.nodes) {
        if (nNode.type === "string") {
          callback(nNode.value.replace(/^\s+|\s+$/g, ""), nNode);
          continue;
        }

        if (nNode.type === "function" && urlFuncRe.test(nNode.value)) {
          const {
            nodes
          } = nNode;
          const [urlNode] = nodes;
          const url = (urlNode === null || urlNode === void 0 ? void 0 : urlNode.type) === "string" ? urlNode.value : valueParser__default["default"].stringify(nodes);
          callback(url.replace(/^\s+|\s+$/g, ""), urlNode);
          continue;
        }
      }
    }
  });
};

var inlineFile = ((file, source) => {
  const mime = mimeTypes.lookup(file) || "application/octet-stream";
  const data = Buffer.from(source).toString("base64");
  return `data:${mime};base64,${data}`;
});

const name$2 = "styles-url";
const placeholderHashDefault = "assets/[name]-[hash][extname]";
const placeholderNoHashDefault = "assets/[name][extname]";

const plugin$2 = (options = {}) => {
  var _options$inline, _options$publicPath, _options$assetDir, _options$resolve, _options$alias, _options$hash;

  const inline = (_options$inline = options.inline) !== null && _options$inline !== void 0 ? _options$inline : false;
  const publicPath = (_options$publicPath = options.publicPath) !== null && _options$publicPath !== void 0 ? _options$publicPath : "./";
  const assetDir = (_options$assetDir = options.assetDir) !== null && _options$assetDir !== void 0 ? _options$assetDir : ".";
  const resolve = (_options$resolve = options.resolve) !== null && _options$resolve !== void 0 ? _options$resolve : resolve$1;
  const alias = (_options$alias = options.alias) !== null && _options$alias !== void 0 ? _options$alias : {};
  const placeholder = ((_options$hash = options.hash) !== null && _options$hash !== void 0 ? _options$hash : true) ? typeof options.hash === "string" ? options.hash : placeholderHashDefault : placeholderNoHashDefault;
  return {
    postcssPlugin: name$2,

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async Once(css, {
      result: res
    }) {
      var _css$source, _css$source$input$map;

      if (!((_css$source = css.source) !== null && _css$source !== void 0 && _css$source.input.file)) return;
      const {
        file
      } = css.source.input;
      const map = mm((_css$source$input$map = css.source.input.map) === null || _css$source$input$map === void 0 ? void 0 : _css$source$input$map.text).resolve(path__default["default"].dirname(file)).toConsumer();
      const urlList = [];
      const imported = res.messages.filter(msg => msg.type === "dependency").map(msg => msg.file);
      css.walkDecls(decl => {
        if (!isDeclWithUrl(decl)) return;
        const parsed = valueParser__default["default"](decl.value);
        walkUrls(parsed, (url, node) => {
          var _decl$source, _decl$source2;

          // Resolve aliases
          for (const [from, to] of Object.entries(alias)) {
            if (url !== from && !url.startsWith(`${from}/`)) continue;
            url = normalizePath(to) + url.slice(from.length);
          } // Empty URL


          if (!node || url.length === 0) {
            decl.warn(res, `Empty URL in \`${decl.toString()}\``);
            return;
          } // Skip Data URI


          if (dataURIRe.test(url)) return; // Skip Web URLs

          if (!isAbsolutePath(url)) {
            try {
              new URL(url);
              return;
            } catch {// Is not a Web URL, continuing
            }
          }

          const basedirs = new Set(); // Use PostCSS imports

          if ((_decl$source = decl.source) !== null && _decl$source !== void 0 && _decl$source.input.file && imported.includes(decl.source.input.file)) basedirs.add(path__default["default"].dirname(decl.source.input.file)); // Use SourceMap

          if ((_decl$source2 = decl.source) !== null && _decl$source2 !== void 0 && _decl$source2.start) {
            const pos = decl.source.start;
            const realPos = map === null || map === void 0 ? void 0 : map.originalPositionFor(pos);
            const basedir = (realPos === null || realPos === void 0 ? void 0 : realPos.source) && path__default["default"].dirname(realPos.source);
            if (basedir) basedirs.add(path__default["default"].normalize(basedir));
          } // Use current file


          basedirs.add(path__default["default"].dirname(file));
          urlList.push({
            node,
            url,
            decl,
            parsed,
            basedirs
          });
        });
      });
      const usedNames = new Map();

      for await (const {
        node,
        url,
        decl,
        parsed,
        basedirs
      } of urlList) {
        let resolved;

        for await (const basedir of basedirs) {
          try {
            if (!resolved) resolved = await resolve(url, basedir);
          } catch {
            /* noop */
          }
        }

        if (!resolved) {
          decl.warn(res, `Unresolved URL \`${url}\` in \`${decl.toString()}\``);
          continue;
        }

        const {
          source,
          from,
          urlQuery
        } = resolved;

        if (!(source instanceof Uint8Array) || typeof from !== "string") {
          decl.warn(res, `Incorrectly resolved URL \`${url}\` in \`${decl.toString()}\``);
          continue;
        }

        res.messages.push({
          plugin: name$2,
          type: "dependency",
          file: from
        });

        if (inline) {
          node.type = "string";
          node.value = inlineFile(from, source);
        } else {
          const unsafeTo = normalizePath(generateName(placeholder, from, source));
          let to = unsafeTo; // Avoid file overrides

          const hasExt = firstExtRe.test(unsafeTo);

          for (let i = 1; usedNames.has(to) && usedNames.get(to) !== from; i++) {
            to = hasExt ? unsafeTo.replace(firstExtRe, `${i}$1`) : `${unsafeTo}${i}`;
          }

          usedNames.set(to, from);
          node.type = "string";
          node.value = publicPath + (/[/\\]$/.test(publicPath) ? "" : "/") + path__default["default"].basename(to);
          if (urlQuery) node.value += urlQuery;
          to = normalizePath(assetDir, to);
          res.messages.push({
            plugin: name$2,
            type: "asset",
            to,
            source
          });
        }

        decl.value = parsed.toString();
      }
    }

  };
};

plugin$2.postcss = true;

var generateScopedNameDefault = ((placeholder = "[name]_[local]__[hash:8]") => (local, file, css) => {
  const {
    dir,
    name,
    base
  } = path__default["default"].parse(file);
  const hash = hasher(`${base}:${css}`);
  const match = hashRe.exec(placeholder);
  const hashLen = match && Number.parseInt(match[1]);
  return pluginutils.makeLegalIdentifier(placeholder.replace("[dir]", path__default["default"].basename(dir)).replace("[name]", name).replace("[local]", local).replace(hashRe, hashLen ? hash.slice(0, hashLen) : hash));
});

var postcssModules = (options => {
  const opts = {
    mode: "local",
    ...options,
    generateScopedName: typeof options.generateScopedName === "function" ? options.generateScopedName : generateScopedNameDefault(options.generateScopedName)
  };
  return [modulesValues__default["default"](), localByDefault__default["default"]({
    mode: opts.mode
  }), extractImports__default["default"]({
    failOnWrongOrder: opts.failOnWrongOrder
  }), modulesScope__default["default"]({
    exportGlobals: opts.exportGlobals,
    generateScopedName: opts.generateScopedName
  })];
});

const load = async (url, file, extensions, processor, opts) => {
  const options = {
    caller: "ICSS loader",
    basedirs: [path__default["default"].dirname(file)],
    extensions
  };
  const from = await resolveAsync([url, `./${url}`], options);
  const source = await fs__default["default"].readFile(from);
  const {
    messages
  } = await processor.process(source, { ...opts,
    from
  });
  const exports = {};

  for (const msg of messages) {
    if (msg.type !== "icss") continue;
    Object.assign(exports, msg.export);
  }

  return exports;
};

async function resolve (icssImports, load, file, extensions, processor, opts) {
  const imports = {};

  for await (const [url, values] of Object.entries(icssImports)) {
    const exports = await load(url, file, extensions, processor, opts);

    for (const [k, v] of Object.entries(values)) {
      imports[k] = exports[v];
    }
  }

  return imports;
}

const name$1 = "styles-icss";
const extensionsDefault = [".css", ".pcss", ".postcss", ".sss"];

const plugin$1 = (options = {}) => {
  var _options$load, _options$extensions;

  const load$1 = (_options$load = options.load) !== null && _options$load !== void 0 ? _options$load : load;
  const extensions = (_options$extensions = options.extensions) !== null && _options$extensions !== void 0 ? _options$extensions : extensionsDefault;
  return {
    postcssPlugin: name$1,

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async OnceExit(css, {
      result: res
    }) {
      var _css$source;

      if (!((_css$source = css.source) !== null && _css$source !== void 0 && _css$source.input.file)) return;
      const opts = { ...res.opts
      };
      delete opts.map;
      const {
        icssImports,
        icssExports
      } = icssUtils.extractICSS(css);
      const imports = await resolve(icssImports, load$1, css.source.input.file, extensions, res.processor, opts);
      icssUtils.replaceSymbols(css, imports);

      for (const [k, v] of Object.entries(icssExports)) {
        res.messages.push({
          plugin: name$1,
          type: "icss",
          export: {
            [k]: icssUtils.replaceValueSymbols(v, imports)
          }
        });
      }
    }

  };
};

plugin$1.postcss = true;

const name = "styles-noop";

const plugin = () => ({
  postcssPlugin: name
});

plugin.postcss = true;

let injectorId;
const cssVarName = "css";
const reservedWords = [cssVarName];

function getClassNameDefault(name) {
  const id = pluginutils.makeLegalIdentifier(name);
  if (reservedWords.includes(id)) return `_${id}`;
  return id;
}

function ensureAutoModules(am, id) {
  if (typeof am === "function") return am(id);
  if (am instanceof RegExp) return am.test(id);
  return am && /\.module\.[A-Za-z]+$/.test(id);
}

const loader$4 = {
  name: "postcss",
  alwaysProcess: true,

  async process({
    code,
    map,
    extracted
  }) {
    var _options$to, _res$map;

    const options = { ...this.options
    };
    const config = await loadConfig(this.id, options.config);
    const plugins = [];
    const autoModules = ensureAutoModules(options.autoModules, this.id);
    const supportModules = Boolean(options.modules || autoModules);
    const modulesExports = {};
    const postcssOpts = { ...config.options,
      ...options.postcss,
      from: this.id,
      to: (_options$to = options.to) !== null && _options$to !== void 0 ? _options$to : this.id,
      map: {
        inline: false,
        annotation: false,
        sourcesContent: this.sourceMap ? this.sourceMap.content : true,
        prev: mm(map).relative(path__default["default"].dirname(this.id)).toObject()
      }
    };
    delete postcssOpts.plugins;
    if (options.import) plugins.push(plugin$3({
      extensions: options.extensions,
      ...options.import
    }));
    if (options.url) plugins.push(plugin$2({
      inline: Boolean(options.inject),
      ...options.url
    }));
    if (options.postcss.plugins) plugins.push(...options.postcss.plugins);
    if (config.plugins) plugins.push(...config.plugins);

    if (supportModules) {
      const modulesOptions = typeof options.modules === "object" ? options.modules : {};
      plugins.push(...postcssModules({
        generateScopedName: undefined,
        failOnWrongOrder: true,
        ...modulesOptions
      }), plugin$1({
        extensions: options.extensions
      }));
    }

    if (options.minimize) {
      const cssnanoOpts = typeof options.minimize === "object" ? options.minimize : {};
      plugins.push(cssnano__default["default"](cssnanoOpts));
    } // Avoid PostCSS warning


    if (plugins.length === 0) plugins.push(plugin);
    const res = await postcss__default["default"](plugins).process(code, postcssOpts);

    for (const msg of res.messages) switch (msg.type) {
      case "warning":
        this.warn({
          name: msg.plugin,
          message: msg.text
        });
        break;

      case "icss":
        Object.assign(modulesExports, msg.export);
        break;

      case "dependency":
        this.deps.add(normalizePath(msg.file));
        break;

      case "asset":
        this.assets.set(msg.to, msg.source);
        break;
    }

    map = mm((_res$map = res.map) === null || _res$map === void 0 ? void 0 : _res$map.toJSON()).resolve(path__default["default"].dirname(postcssOpts.to)).toString();

    if (!options.extract && this.sourceMap) {
      const m = mm(map).modify(map => void delete map.file).relative();
      if (this.sourceMap.transform) m.modify(this.sourceMap.transform);
      map = m.toString();
      res.css += m.toCommentData();
    }

    if (options.emit) return {
      code: res.css,
      map
    };

    const saferId = id => safeId(id, path__default["default"].basename(this.id));

    const modulesVarName = saferId("modules");
    const output = [`export var ${cssVarName} = ${JSON.stringify(res.css)};`];
    const dts = [`export var ${cssVarName}: string;`];

    if (options.namedExports) {
      const getClassName = typeof options.namedExports === "function" ? options.namedExports : getClassNameDefault;

      for (const name in modulesExports) {
        const newName = getClassName(name);
        if (name !== newName) this.warn(`Exported \`${name}\` as \`${newName}\` in ${humanlizePath(this.id)}`);
        const fmt = JSON.stringify(modulesExports[name]);
        output.push(`export var ${newName} = ${fmt};`);
        if (options.dts) dts.push(`export var ${newName}: ${fmt};`);
      }
    }

    if (options.extract) extracted = {
      id: this.id,
      css: res.css,
      map
    };

    if (options.inject) {
      if (typeof options.inject === "function") {
        output.push(options.inject(cssVarName, this.id), `var ${modulesVarName} = ${JSON.stringify(modulesExports)};`);
      } else {
        const {
          treeshakeable,
          ...injectorOptions
        } = typeof options.inject === "object" ? options.inject : {};
        const injectorName = saferId("injector");
        const injectorCall = `${injectorName}(${cssVarName},${JSON.stringify(injectorOptions)});`;

        if (!injectorId) {
          const opts = {
            basedirs: [path__default["default"].join(__dirname, "runtime")]
          };
          injectorId = await resolveAsync(["./inject-css"], opts);
          injectorId = `"${normalizePath(injectorId)}"`;
        }

        output.unshift(`import ${injectorName} from ${injectorId};`);
        if (!treeshakeable) output.push(`var ${modulesVarName} = ${JSON.stringify(modulesExports)};`, injectorCall);

        if (treeshakeable) {
          output.push("var injected = false;");
          const injectorCallOnce = `if (!injected) { injected = true; ${injectorCall} }`;

          if (modulesExports.inject) {
            throw new Error("`inject` keyword is reserved when using `inject.treeshakeable` option");
          }

          let getters = "";

          for (const [k, v] of Object.entries(modulesExports)) {
            const name = JSON.stringify(k);
            const value = JSON.stringify(v);
            getters += `get ${name}() { ${injectorCallOnce} return ${value}; },\n`;
          }

          getters += `inject() { ${injectorCallOnce} },`;
          output.push(`var ${modulesVarName} = {${getters}};`);
        }
      }
    }

    if (!options.inject) output.push(`var ${modulesVarName} = ${JSON.stringify(modulesExports)};`);
    const defaultExport = `export default ${supportModules ? modulesVarName : cssVarName};`;
    output.push(defaultExport);

    if (options.dts && (await fs__default["default"].pathExists(this.id))) {
      if (supportModules) dts.push(`interface ModulesExports ${JSON.stringify(modulesExports)}`, typeof options.inject === "object" && options.inject.treeshakeable ? `interface ModulesExports {inject:()=>void}` : "", `declare const ${modulesVarName}: ModulesExports;`);
      dts.push(defaultExport);
      await fs__default["default"].writeFile(`${this.id}.d.ts`, dts.filter(Boolean).join("\n"));
    }

    return {
      code: output.filter(Boolean).join("\n"),
      map,
      extracted
    };
  }

};

const loader$3 = {
  name: "sourcemap",
  alwaysProcess: true,

  async process({
    code,
    map
  }) {
    var _await$getMap;

    map = (_await$getMap = await getMap(code, this.id)) !== null && _await$getMap !== void 0 ? _await$getMap : map;
    return {
      code: stripMap(code),
      map
    };
  }

};

const ids = ["node-sass", "sass"];
const idsFmt = arrayFmt(ids);
function loadSass (impl) {
  // Loading provided implementation
  if (impl) {
    const provided = loadModule(impl);
    if (provided) return [provided, impl];
    throw new Error(`Could not load \`${impl}\` Sass implementation`);
  } // Loading one of the supported modules


  for (const id of ids) {
    const sass = loadModule(id);
    if (sass) return [sass, id];
  }

  throw new Error(`You need to install ${idsFmt} package in order to process Sass files`);
}

const isModule = url => /^~[\d@A-Za-z]/.test(url);
function getUrlOfPartial(url) {
  const {
    dir,
    base
  } = path__default["default"].parse(url);
  return dir ? `${normalizePath(dir)}/_${base}` : `_${base}`;
}
function normalizeUrl(url) {
  if (isModule(url)) return normalizePath(url.slice(1));
  if (isAbsolutePath(url) || isRelativePath(url)) return normalizePath(url);
  return `./${normalizePath(url)}`;
}

const extensions$1 = [".scss", ".sass", ".css"];
const importer$1 = (url, importer, done) => {
  const finalize = id => done({
    file: id.replace(/\.css$/i, "")
  });

  const next = () => done(null);

  if (!isModule(url)) return next();
  const moduleUrl = normalizeUrl(url);
  const partialUrl = getUrlOfPartial(moduleUrl);
  const options = {
    caller: "Sass importer",
    basedirs: [path__default["default"].dirname(importer)],
    extensions: extensions$1
  }; // Give precedence to importing a partial

  resolveAsync([partialUrl, moduleUrl], options).then(finalize).catch(next);
};

const finalize = id => ({
  file: id.replace(/\.css$/i, "")
});

const importerSync = (url, importer) => {
  if (!isModule(url)) return null;
  const moduleUrl = normalizeUrl(url);
  const partialUrl = getUrlOfPartial(moduleUrl);
  const options = {
    caller: "Sass importer",
    basedirs: [path__default["default"].dirname(importer)],
    extensions: extensions$1
  }; // Give precedence to importing a partial

  try {
    return finalize(resolveSync([partialUrl, moduleUrl], options));
  } catch {
    return null;
  }
};

const loader$2 = {
  name: "sass",
  test: /\.(sass|scss)$/i,

  async process({
    code,
    map
  }) {
    var _options$sync;

    const options = { ...this.options
    };
    const [sass, type] = loadSass(options.impl);
    const sync = (_options$sync = options.sync) !== null && _options$sync !== void 0 ? _options$sync : type !== "node-sass";
    const importers = [sync ? importerSync : importer$1];
    if (options.data) code = options.data + code;
    if (options.importer) Array.isArray(options.importer) ? importers.push(...options.importer) : importers.push(options.importer);

    const render = async options => new Promise((resolve, reject) => {
      if (sync) resolve(sass.renderSync(options));else sass.render(options, (err, css) => err ? reject(err) : resolve(css));
    }); // Remove non-Sass options


    delete options.impl;
    delete options.sync; // node-sass won't produce sourcemaps if the `data`
    // option is used and `sourceMap` option is not a string.
    //
    // In case it is a string, `sourceMap` option
    // should be a path where the sourcemap is written.
    //
    // But since we're using the `data` option,
    // the sourcemap will not actually be written, but
    // all paths in sourcemap's sources will be relative to that path.

    const res = await render({ ...options,
      file: this.id,
      data: code,
      indentedSyntax: /\.sass$/i.test(this.id),
      sourceMap: this.id,
      omitSourceMapUrl: true,
      sourceMapContents: true,
      importer: importers
    });
    const deps = res.stats.includedFiles;

    for (const dep of deps) this.deps.add(normalizePath(dep));

    return {
      code: Buffer.from(res.css).toString(),
      map: res.map ? Buffer.from(res.map).toString() : map
    };
  }

};

const loader$1 = {
  name: "stylus",
  test: /\.(styl|stylus)$/i,

  async process({
    code,
    map
  }) {
    var _style$sourcemap, _mm$toString;

    const options = { ...this.options
    };
    const stylus = loadModule("stylus");
    if (!stylus) throw new Error("You need to install `stylus` package in order to process Stylus files");
    const basePath = normalizePath(path__default["default"].dirname(this.id));
    const paths = [`${basePath}/node_modules`, basePath];
    if (options.paths) paths.push(...options.paths);
    const style = stylus(code, options).set("filename", this.id).set("paths", paths).set("sourcemap", {
      comment: false,
      basePath
    });

    const render = async () => new Promise((resolve, reject) => {
      style.render((err, css) => err ? reject(err) : resolve(css));
    });

    code = await render();
    const deps = style.deps();

    for (const dep of deps) this.deps.add(normalizePath(dep)); // We have to manually modify the `sourcesContent` field
    // since stylus compiler doesn't support it yet


    if ((_style$sourcemap = style.sourcemap) !== null && _style$sourcemap !== void 0 && _style$sourcemap.sources && !style.sourcemap.sourcesContent) {
      style.sourcemap.sourcesContent = await Promise.all(style.sourcemap.sources.map(async source => {
        const file = normalizePath(basePath, source);
        const exists = await fs__default["default"].pathExists(file);
        if (!exists) return null;
        return fs__default["default"].readFile(file, "utf8");
      }));
    }

    map = (_mm$toString = mm(style.sourcemap).toString()) !== null && _mm$toString !== void 0 ? _mm$toString : map;
    return {
      code,
      map
    };
  }

};

const extensions = [".less", ".css"];

const getStylesFileManager = less => new class extends less.AbstractFileManager {
  supports() {
    return true;
  }

  async loadFile(filename, filedir, opts) {
    const url = normalizeUrl(filename);
    const partialUrl = getUrlOfPartial(url);
    const options = {
      caller: "Less importer",
      basedirs: [filedir],
      extensions
    };
    if (opts.paths) options.basedirs.push(...opts.paths); // Give precedence to importing a partial

    const id = await resolveAsync([partialUrl, url], options);
    return {
      filename: id,
      contents: await fs__default["default"].readFile(id, "utf8")
    };
  }

}();

const importer = {
  install(less, pluginManager) {
    pluginManager.addFileManager(getStylesFileManager(less));
  }

};

const loader = {
  name: "less",
  test: /\.less$/i,

  async process({
    code,
    map
  }) {
    var _res$map;

    const options = { ...this.options
    };
    const less = loadModule("less");
    if (!less) throw new Error("You need to install `less` package in order to process Less files");
    const plugins = [importer];
    if (options.plugins) plugins.push(...options.plugins);
    const res = await less.render(code, { ...options,
      plugins,
      filename: this.id,
      sourceMap: {
        outputSourceFiles: true,
        sourceMapBasepath: path__default["default"].dirname(this.id)
      }
    });
    const deps = res.imports;

    for (const dep of deps) this.deps.add(normalizePath(dep));

    return {
      code: res.css,
      map: (_res$map = res.map) !== null && _res$map !== void 0 ? _res$map : map
    };
  }

};

function matchFile(file, condition) {
  if (!condition) return false;
  if (typeof condition === "function") return condition(file);
  return condition.test(file);
} // This queue makes sure one thread is always available,
// which is necessary for some cases
// ex.: https://github.com/sass/node-sass/issues/857


const threadPoolSize = process.env.UV_THREADPOOL_SIZE ? Number.parseInt(process.env.UV_THREADPOOL_SIZE) : 4; // default `libuv` threadpool size

const workQueue = new PQueue__default["default"]({
  concurrency: threadPoolSize - 1
});
class Loaders {
  constructor(options) {
    _defineProperty(this, "use", void 0);

    _defineProperty(this, "test", void 0);

    _defineProperty(this, "loaders", new Map());

    this.use = new Map(options.use.reverse());

    this.test = file => options.extensions.some(ext => file.toLowerCase().endsWith(ext));

    this.add(loader$4, loader$3, loader$2, loader, loader$1);
    if (options.loaders) this.add(...options.loaders);
  }

  add(...loaders) {
    for (const loader of loaders) {
      if (!this.use.has(loader.name)) continue;
      this.loaders.set(loader.name, loader);
    }
  }

  isSupported(file) {
    if (this.test(file)) return true;

    for (const [, loader] of this.loaders) {
      if (matchFile(file, loader.test)) return true;
    }

    return false;
  }

  async process(payload, context) {
    for await (const [name, options] of this.use) {
      const loader = this.loaders.get(name);
      if (!loader) continue;
      const ctx = { ...context,
        options
      };

      if (loader.alwaysProcess || matchFile(ctx.id, loader.test)) {
        payload = await workQueue.add(loader.process.bind(ctx, payload));
      }
    }

    return payload;
  }

}

async function concat (extracted) {
  const sm = new sourceMapJs.SourceMapGenerator({
    file: ""
  });
  const content = [];
  let offset = 0;

  for await (const {
    css,
    map
  } of extracted) {
    content.push(css);

    const _map = mm(map);

    const data = _map.toObject();

    if (!data) continue;

    const consumer = _map.toConsumer();

    if (!consumer) continue;
    consumer.eachMapping(m => sm.addMapping({
      generated: {
        line: offset + m.generatedLine,
        column: m.generatedColumn
      },
      original: {
        line: m.originalLine,
        column: m.originalColumn
      },
      source: m.source,
      name: m.name
    }));

    if (data.sourcesContent) {
      for (const source of data.sources) {
        const content = consumer.sourceContentFor(source, true);
        sm.setSourceContent(source, content);
      }
    }

    offset += css.split("\n").length;
  }

  return {
    css: content.join("\n"),
    map: sm
  };
}

var index = ((options = {}) => {
  var _options$dts, _options$namedExports, _options$autoModules, _options$extensions;

  const isIncluded = pluginutils.createFilter(options.include, options.exclude);
  const sourceMap = inferSourceMapOption(options.sourceMap);
  const loaderOpts = { ...inferModeOption(options.mode),
    minimize: inferOption(options.minimize, false),
    config: inferOption(options.config, {}),
    import: inferHandlerOption(options.import, options.alias),
    url: inferHandlerOption(options.url, options.alias),
    modules: inferOption(options.modules, false),
    to: options.to,
    dts: (_options$dts = options.dts) !== null && _options$dts !== void 0 ? _options$dts : false,
    namedExports: (_options$namedExports = options.namedExports) !== null && _options$namedExports !== void 0 ? _options$namedExports : false,
    autoModules: (_options$autoModules = options.autoModules) !== null && _options$autoModules !== void 0 ? _options$autoModules : false,
    extensions: (_options$extensions = options.extensions) !== null && _options$extensions !== void 0 ? _options$extensions : [".css", ".pcss", ".postcss", ".sss"],
    postcss: {}
  };
  if (typeof loaderOpts.inject === "object" && loaderOpts.inject.treeshakeable && loaderOpts.namedExports) throw new Error("`inject.treeshakeable` option is incompatible with `namedExports` option");
  if (options.parser) loaderOpts.postcss.parser = ensurePCSSOption(options.parser, "parser");
  if (options.syntax) loaderOpts.postcss.syntax = ensurePCSSOption(options.syntax, "syntax");
  if (options.stringifier) loaderOpts.postcss.stringifier = ensurePCSSOption(options.stringifier, "stringifier");
  if (options.plugins) loaderOpts.postcss.plugins = ensurePCSSPlugins(options.plugins);
  const loaders = new Loaders({
    use: [["postcss", loaderOpts], ...ensureUseOption(options), ["sourcemap", {}]],
    loaders: options.loaders,
    extensions: loaderOpts.extensions
  });
  let extracted = [];
  const plugin = {
    name: "styles",

    async transform(code, id) {
      if (!isIncluded(id) || !loaders.isSupported(id)) return null; // Skip empty files

      if (code.replace(/\s/g, "") === "") return null; // Check if file was already processed into JS
      // by other instance(s) of this or other plugin(s)

      try {
        this.parse(code, {}); // If it doesn't throw...

        this.warn(`Skipping processed file ${humanlizePath(id)}`);
        return null;
      } catch {// Was not already processed, continuing
      }

      if (typeof options.onImport === "function") options.onImport(code, id);
      const ctx = {
        id,
        sourceMap,
        deps: new Set(),
        assets: new Map(),
        warn: this.warn.bind(this),
        plugin: this,
        options: {}
      };
      const res = await loaders.process({
        code
      }, ctx);

      for (const dep of ctx.deps) this.addWatchFile(dep);

      for (const [fileName, source] of ctx.assets) this.emitFile({
        type: "asset",
        fileName,
        source
      });

      if (res.extracted) {
        const {
          id
        } = res.extracted;
        extracted = extracted.filter(e => e.id !== id);
        extracted.push(res.extracted);
      }

      return {
        code: res.code,
        map: sourceMap && res.map ? res.map : {
          mappings: ""
        },
        moduleSideEffects: res.extracted ? true : null
      };
    },

    augmentChunkHash(chunk) {
      if (extracted.length === 0) return;
      const ids = [];

      for (const module of Object.keys(chunk.modules)) {
        const traversed = new Set();
        let current = [module];

        do {
          const imports = [];

          for (const id of current) {
            if (traversed.has(id)) continue;

            if (loaders.isSupported(id)) {
              if (isIncluded(id)) imports.push(id);
              continue;
            }

            traversed.add(id);
            const i = this.getModuleInfo(id);
            i && imports.push(...i.importedIds);
          }

          current = imports;
        } while (current.some(id => !loaders.isSupported(id)));

        ids.push(...current);
      }

      const hashable = extracted.filter(e => ids.includes(e.id)).sort((a, b) => ids.lastIndexOf(a.id) - ids.lastIndexOf(b.id)).map(e => `${path__default["default"].basename(e.id)}:${e.css}`);
      if (hashable.length === 0) return;
      return hashable.join(":");
    },

    async generateBundle(opts, bundle) {
      var _opts$dir;

      if (extracted.length === 0 || !(opts.dir || opts.file)) return; // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- either `file` or `dir` are always present

      const dir = (_opts$dir = opts.dir) !== null && _opts$dir !== void 0 ? _opts$dir : path__default["default"].dirname(opts.file);
      const chunks = Object.values(bundle).filter(c => c.type === "chunk");
      const manual = chunks.filter(c => !c.facadeModuleId);
      const emitted = opts.preserveModules ? chunks : chunks.filter(c => c.isEntry || c.isDynamicEntry);
      const emittedList = [];

      const getExtractedData = async (name, ids) => {
        const fileName = typeof loaderOpts.extract === "string" ? normalizePath(loaderOpts.extract).replace(/^\.[/\\]/, "") : normalizePath(`${name}.css`);
        if (isAbsolutePath(fileName)) this.error(["Extraction path must be relative to the output directory,", `which is ${humanlizePath(dir)}`].join("\n"));
        if (isRelativePath(fileName)) this.error(["Extraction path must be nested inside output directory,", `which is ${humanlizePath(dir)}`].join("\n"));
        const entries = extracted.filter(e => ids.includes(e.id)).sort((a, b) => ids.lastIndexOf(a.id) - ids.lastIndexOf(b.id));
        const res = await concat(entries);
        return {
          name: fileName,
          css: res.css,
          map: mm(res.map.toString()).relative(path__default["default"].dirname(path__default["default"].resolve(dir, fileName))).toString()
        };
      };

      const getName = chunk => {
        if (opts.file) return path__default["default"].parse(opts.file).name;

        if (opts.preserveModules) {
          const {
            dir,
            name
          } = path__default["default"].parse(chunk.fileName);
          return dir ? `${dir}/${name}` : name;
        }

        return chunk.name;
      };

      const getImports = chunk => {
        const ids = [];

        for (const module of Object.keys(chunk.modules)) {
          const traversed = new Set();
          let current = [module];

          do {
            const imports = [];

            for (const id of current) {
              if (traversed.has(id)) continue;

              if (loaders.isSupported(id)) {
                if (isIncluded(id)) imports.push(id);
                continue;
              }

              traversed.add(id);
              const i = this.getModuleInfo(id);
              i && imports.push(...i.importedIds);
            }

            current = imports;
          } while (current.some(id => !loaders.isSupported(id)));

          ids.push(...current);
        }

        return ids;
      };

      const moved = [];

      if (typeof loaderOpts.extract === "string") {
        const ids = [];

        for (const chunk of manual) {
          const chunkIds = getImports(chunk);
          moved.push(...chunkIds);
          ids.push(...chunkIds);
        }

        for (const chunk of emitted) ids.push(...getImports(chunk).filter(id => !moved.includes(id)));

        const name = getName(chunks[0]);
        emittedList.push([name, ids]);
      } else {
        for (const chunk of manual) {
          const ids = getImports(chunk);
          if (ids.length === 0) continue;
          moved.push(...ids);
          const name = getName(chunk);
          emittedList.push([name, ids]);
        }

        for (const chunk of emitted) {
          const ids = getImports(chunk).filter(id => !moved.includes(id));
          if (ids.length === 0) continue;
          const name = getName(chunk);
          emittedList.push([name, ids]);
        }
      }

      for await (const [name, ids] of emittedList) {
        const res = await getExtractedData(name, ids);

        if (typeof options.onExtract === "function") {
          const shouldExtract = options.onExtract(res);
          if (!shouldExtract) continue;
        } // Perform minimization on the extracted file


        if (loaderOpts.minimize) {
          var _resMin$map;

          const cssnanoOpts = typeof loaderOpts.minimize === "object" ? loaderOpts.minimize : {};
          const minifier = cssnano__default["default"](cssnanoOpts);
          const resMin = await minifier.process(res.css, {
            from: res.name,
            to: res.name,
            map: sourceMap && {
              inline: false,
              annotation: false,
              sourcesContent: sourceMap.content,
              prev: res.map
            }
          });
          res.css = resMin.css;
          res.map = (_resMin$map = resMin.map) === null || _resMin$map === void 0 ? void 0 : _resMin$map.toString();
        }

        const cssFile = {
          type: "asset",
          name: res.name,
          source: res.css
        };
        const cssFileId = this.emitFile(cssFile);

        if (res.map && sourceMap) {
          const fileName = this.getFileName(cssFileId);
          const assetDir = typeof opts.assetFileNames === "string" ? normalizePath(path__default["default"].dirname(opts.assetFileNames)) : typeof opts.assetFileNames === "function" ? normalizePath(path__default["default"].dirname(opts.assetFileNames(cssFile))) : "assets"; // Default for Rollup v2

          const map = mm(res.map).modify(m => m.file = path__default["default"].basename(fileName)).modifySources(s => {
            // Compensate for possible nesting depending on `assetFileNames` value
            if (s === "<no source>") return s;
            if (assetDir.length <= 1) return s;
            s = `../${s}`; // ...then there's definitely at least 1 level offset

            for (const c of assetDir) if (c === "/") s = `../${s}`;

            return s;
          });

          if (sourceMap.inline) {
            map.modify(m => {
              var _sourceMap$transform;

              return (_sourceMap$transform = sourceMap.transform) === null || _sourceMap$transform === void 0 ? void 0 : _sourceMap$transform.call(sourceMap, m, normalizePath(dir, fileName));
            });
            bundle[fileName].source += map.toCommentData();
          } else {
            const mapFileName = `${fileName}.map`;
            map.modify(m => {
              var _sourceMap$transform2;

              return (_sourceMap$transform2 = sourceMap.transform) === null || _sourceMap$transform2 === void 0 ? void 0 : _sourceMap$transform2.call(sourceMap, m, normalizePath(dir, mapFileName));
            });
            this.emitFile({
              type: "asset",
              fileName: mapFileName,
              source: map.toString()
            });
            const {
              base
            } = path__default["default"].parse(mapFileName);
            bundle[fileName].source += map.toCommentFile(base);
          }
        }
      }
    }

  };
  return plugin;
});

module.exports = index;
