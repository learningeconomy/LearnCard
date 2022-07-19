function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };
  return _extends.apply(this, arguments);
}

// Copyright 2018 Consensys AG
function inMemoryCache() {
  const cache = new Map();
  return async (parsed, resolve) => {
    var _result$didResolution;

    if (parsed.params && parsed.params['no-cache'] === 'true') return await resolve();
    const cached = cache.get(parsed.didUrl);
    if (cached !== undefined) return cached;
    const result = await resolve();

    if (((_result$didResolution = result.didResolutionMetadata) == null ? void 0 : _result$didResolution.error) !== 'notFound') {
      cache.set(parsed.didUrl, result);
    }

    return result;
  };
}
function noCache(parsed, resolve) {
  return resolve();
}
const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})';
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`;
const METHOD = '([a-z0-9]+)';
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`;
const PARAM_CHAR = '[a-zA-Z0-9_.:%-]';
const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`;
const PARAMS = `((${PARAM})*)`;
const PATH = `(/[^#?]*)?`;
const QUERY = `([?][^#]*)?`;
const FRAGMENT = `(#.*)?`;
const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`);
function parse(didUrl) {
  if (didUrl === '' || !didUrl) return null;
  const sections = didUrl.match(DID_MATCHER);

  if (sections) {
    const parts = {
      did: `did:${sections[1]}:${sections[2]}`,
      method: sections[1],
      id: sections[2],
      didUrl
    };

    if (sections[4]) {
      const params = sections[4].slice(1).split(';');
      parts.params = {};

      for (const p of params) {
        const kv = p.split('=');
        parts.params[kv[0]] = kv[1];
      }
    }

    if (sections[6]) parts.path = sections[6];
    if (sections[7]) parts.query = sections[7].slice(1);
    if (sections[8]) parts.fragment = sections[8].slice(1);
    return parts;
  }

  return null;
}
const EMPTY_RESULT = {
  didResolutionMetadata: {},
  didDocument: null,
  didDocumentMetadata: {}
};
function wrapLegacyResolver(resolve) {
  return async (did, parsed, resolver) => {
    try {
      const doc = await resolve(did, parsed, resolver);
      return _extends({}, EMPTY_RESULT, {
        didResolutionMetadata: {
          contentType: 'application/did+ld+json'
        },
        didDocument: doc
      }); // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e) {
      return _extends({}, EMPTY_RESULT, {
        didResolutionMetadata: {
          error: 'notFound',
          message: e.toString() // This is not in spec, but may be helpful

        }
      });
    }
  };
}
class Resolver {
  constructor(registry = {}, options = {}) {
    this.registry = void 0;
    this.cache = void 0;
    this.registry = registry;
    this.cache = options.cache === true ? inMemoryCache() : options.cache || noCache;

    if (options.legacyResolvers) {
      Object.keys(options.legacyResolvers).map(methodName => {
        if (!this.registry[methodName]) {
          this.registry[methodName] = wrapLegacyResolver( // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          options.legacyResolvers[methodName]);
        }
      });
    }
  }

  async resolve(didUrl, options = {}) {
    const parsed = parse(didUrl);

    if (parsed === null) {
      return _extends({}, EMPTY_RESULT, {
        didResolutionMetadata: {
          error: 'invalidDid'
        }
      });
    }

    const resolver = this.registry[parsed.method];

    if (!resolver) {
      return _extends({}, EMPTY_RESULT, {
        didResolutionMetadata: {
          error: 'unsupportedDidMethod'
        }
      });
    }

    return this.cache(parsed, () => resolver(parsed.did, parsed, this, options));
  }

}

export { Resolver, inMemoryCache, noCache, parse, wrapLegacyResolver };
//# sourceMappingURL=resolver.modern.js.map
