function _extends() {
  _extends = Object.assign || function (target) {
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

var CAIP2 = {
  name: "chainId",
  regex: "[-:a-zA-Z0-9]{5,41}",
  parameters: {
    delimiter: ":",
    values: {
      0: {
        name: "namespace",
        regex: "[-a-z0-9]{3,8}"
      },
      1: {
        name: "reference",
        regex: "[-a-zA-Z0-9]{1,32}"
      }
    }
  }
};
var CAIP10 = {
  name: "accountId",
  regex: "[-:a-zA-Z0-9]{7,106}",
  parameters: {
    delimiter: ":",
    values: {
      0: {
        name: "namespace",
        regex: "[-a-z0-9]{3,8}"
      },
      1: {
        name: "reference",
        regex: "[-a-zA-Z0-9]{1,32}"
      },
      2: {
        name: "address",
        regex: "[a-zA-Z0-9]{1,64}"
      }
    }
  }
};
var AssetName$1 = {
  name: "assetName",
  regex: "[-:a-zA-Z0-9]{5,73}",
  parameters: {
    delimiter: ":",
    values: {
      0: {
        name: "namespace",
        regex: "[-a-z0-9]{3,8}"
      },
      1: {
        name: "reference",
        regex: "[-a-zA-Z0-9]{1,64}"
      }
    }
  }
};
var CAIP19AssetType = {
  name: "assetType",
  regex: "[-:a-zA-Z0-9]{11,115}",
  parameters: {
    delimiter: "/",
    values: {
      0: CAIP2,
      1: AssetName$1
    }
  }
};
var CAIP19AssetId = {
  name: "assetId",
  regex: "[-:a-zA-Z0-9]{13,148}",
  parameters: {
    delimiter: "/",
    values: {
      0: CAIP2,
      1: AssetName$1,
      2: {
        name: "tokenId",
        regex: "[-a-zA-Z0-9]{1,32}"
      }
    }
  }
};
var CAIP = {
  "2": CAIP2,
  "10": CAIP10,
  "19": {
    assetName: AssetName$1,
    assetType: CAIP19AssetType,
    assetId: CAIP19AssetId
  }
};

function splitParams(id, spec) {
  return id.split(spec.parameters.delimiter);
}
function getParams(id, spec) {
  var arr = splitParams(id, spec);
  var params = {};
  arr.forEach(function (value, index) {
    params[spec.parameters.values[index].name] = value;
  });
  return params;
}
function joinParams(params, spec) {
  return Object.values(spec.parameters.values).map(function (parameter) {
    var param = params[parameter.name];
    return typeof param === "string" ? param : joinParams(param, parameter);
  }).join(spec.parameters.delimiter);
}
function isValidId(id, spec) {
  if (!new RegExp(spec.regex).test(id)) return false;
  var params = splitParams(id, spec);
  if (params.length !== Object.keys(spec.parameters.values).length) return false;
  var matches = params.map(function (param, index) {
    return new RegExp(spec.parameters.values[index].regex).test(param);
  }).filter(function (x) {
    return !!x;
  });
  if (matches.length !== params.length) return false;
  return true;
}

var ChainId = /*#__PURE__*/function () {
  function ChainId(params) {
    if (typeof params === "string") {
      params = ChainId.parse(params);
    }

    this.namespace = params.namespace;
    this.reference = params.reference;
  }

  ChainId.parse = function parse(id) {
    if (!isValidId(id, this.spec)) {
      throw new Error("Invalid " + this.spec.name + " provided: " + id);
    }

    return new ChainId(getParams(id, this.spec)).toJSON();
  };

  ChainId.format = function format(params) {
    return joinParams(params, this.spec);
  };

  var _proto = ChainId.prototype;

  _proto.toString = function toString() {
    return ChainId.format(this.toJSON());
  };

  _proto.toJSON = function toJSON() {
    return {
      namespace: this.namespace,
      reference: this.reference
    };
  };

  return ChainId;
}();
ChainId.spec = CAIP["2"];

var AccountId = /*#__PURE__*/function () {
  function AccountId(params) {
    if (typeof params === "string") {
      params = AccountId.parse(params);
    }

    this.chainId = new ChainId(params.chainId);
    this.address = params.address;
  }

  AccountId.parse = function parse(id) {
    if (!isValidId(id, this.spec)) {
      throw new Error("Invalid " + this.spec.name + " provided: " + id);
    }

    var _getParams = getParams(id, this.spec),
        namespace = _getParams.namespace,
        reference = _getParams.reference,
        address = _getParams.address;

    var chainId = new ChainId({
      namespace: namespace,
      reference: reference
    });
    return new AccountId({
      chainId: chainId,
      address: address
    }).toJSON();
  };

  AccountId.format = function format(params) {
    var chainId = new ChainId(params.chainId);

    var splitParams = _extends({}, chainId.toJSON(), {
      address: params.address
    });

    return joinParams(splitParams, this.spec);
  };

  var _proto = AccountId.prototype;

  _proto.toString = function toString() {
    return AccountId.format(this.toJSON());
  };

  _proto.toJSON = function toJSON() {
    return {
      chainId: this.chainId.toJSON(),
      address: this.address
    };
  };

  return AccountId;
}();
AccountId.spec = CAIP["10"];

var AssetName = /*#__PURE__*/function () {
  function AssetName(params) {
    if (typeof params === "string") {
      params = AssetName.parse(params);
    }

    this.namespace = params.namespace;
    this.reference = params.reference;
  }

  AssetName.parse = function parse(id) {
    if (!isValidId(id, this.spec)) {
      throw new Error("Invalid " + this.spec.name + " provided: " + id);
    }

    return new AssetName(getParams(id, this.spec)).toJSON();
  };

  AssetName.format = function format(params) {
    return joinParams(params, this.spec);
  };

  var _proto = AssetName.prototype;

  _proto.toString = function toString() {
    return AssetName.format(this.toJSON());
  };

  _proto.toJSON = function toJSON() {
    return {
      namespace: this.namespace,
      reference: this.reference
    };
  };

  return AssetName;
}();
AssetName.spec = CAIP["19"].assetName;

var AssetType = /*#__PURE__*/function () {
  function AssetType(params) {
    if (typeof params === "string") {
      params = AssetType.parse(params);
    }

    this.chainId = new ChainId(params.chainId);
    this.assetName = new AssetName(params.assetName);
  }

  AssetType.parse = function parse(id) {
    if (!isValidId(id, this.spec)) {
      throw new Error("Invalid " + this.spec.name + " provided: " + id);
    }

    return new AssetType(getParams(id, this.spec)).toJSON();
  };

  AssetType.format = function format(params) {
    return joinParams(params, this.spec);
  };

  var _proto = AssetType.prototype;

  _proto.toString = function toString() {
    return AssetType.format(this.toJSON());
  };

  _proto.toJSON = function toJSON() {
    return {
      chainId: this.chainId.toJSON(),
      assetName: this.assetName
    };
  };

  return AssetType;
}();
AssetType.spec = CAIP["19"].assetType;

var AssetId = /*#__PURE__*/function () {
  function AssetId(params) {
    if (typeof params === "string") {
      params = AssetId.parse(params);
    }

    this.chainId = new ChainId(params.chainId);
    this.assetName = new AssetName(params.assetName);
    this.tokenId = params.tokenId;
  }

  AssetId.parse = function parse(id) {
    if (!isValidId(id, this.spec)) {
      throw new Error("Invalid " + this.spec.name + " provided: " + id);
    }

    return new AssetId(getParams(id, this.spec)).toJSON();
  };

  AssetId.format = function format(params) {
    return joinParams(params, this.spec);
  };

  var _proto = AssetId.prototype;

  _proto.toString = function toString() {
    return AssetId.format(this.toJSON());
  };

  _proto.toJSON = function toJSON() {
    return {
      chainId: this.chainId.toJSON(),
      assetName: this.assetName.toJSON(),
      tokenId: this.tokenId
    };
  };

  return AssetId;
}();
AssetId.spec = CAIP["19"].assetId;

exports.AccountId = AccountId;
exports.AssetId = AssetId;
exports.AssetType = AssetType;
exports.ChainId = ChainId;
//# sourceMappingURL=index.js.map
