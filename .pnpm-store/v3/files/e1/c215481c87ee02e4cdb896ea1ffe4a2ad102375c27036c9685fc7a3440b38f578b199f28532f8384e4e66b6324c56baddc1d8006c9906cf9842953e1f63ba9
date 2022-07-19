"use strict";
// tslint:disable:strict-type-predicates
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSchemaMatch = exports.schemaPrimitiveValues = void 0;
exports.schemaPrimitiveValues = {
    boolean: false,
    requiredBoolean: true,
    string: '',
    requiredString: 'REQUIRED',
};
var schemaRequiredValues = new Set([
    exports.schemaPrimitiveValues.requiredBoolean,
    exports.schemaPrimitiveValues.requiredString,
]);
function checkSchemaMatch(value, schema, errors) {
    if (value === undefined) {
        errors.push('Root value is undefined');
        return false;
    }
    return checkSchemaMatchRecursively(value, schema, '', errors);
}
exports.checkSchemaMatch = checkSchemaMatch;
// eslint-disable-next-line complexity
function checkSchemaMatchRecursively(value, schema, prefix, errors) {
    if (typeof schema === 'boolean' || typeof schema === 'string') {
        var schemeType = typeof schema;
        if (value === undefined && schemaRequiredValues.has(schema)) {
            errors.push("Value for \"".concat(prefix, "\" is required and must have type \"").concat(schemeType, "\""));
            return false;
        }
        var valueType = typeof value;
        if (value !== undefined && typeof schema !== valueType) {
            errors.push("Type of values for \"".concat(prefix, "\" is not the same, expected=").concat(schemeType, ", actual=").concat(valueType));
            return false;
        }
        return true;
    }
    if (value === undefined) {
        return true;
    }
    if (Array.isArray(schema)) {
        if (!Array.isArray(value)) {
            return false;
        }
        var result_1 = true;
        for (var i = 0; i < value.length; ++i) {
            if (!checkSchemaMatchRecursively(value[i], schema[0], "".concat(prefix, "[").concat(i, "]"), errors)) {
                result_1 = false;
            }
        }
        return result_1;
    }
    var result = true;
    for (var _i = 0, _a = Object.keys(value); _i < _a.length; _i++) {
        var valueKey = _a[_i];
        if (schema[valueKey] === undefined) {
            errors.push("Exceeded property \"".concat(valueKey, "\" found in ").concat(prefix.length === 0 ? 'the root' : prefix));
            result = false;
        }
    }
    for (var _b = 0, _c = Object.keys(schema); _b < _c.length; _b++) {
        var schemaKey = _c[_b];
        var isSubValueSchemeMatched = checkSchemaMatchRecursively(value[schemaKey], schema[schemaKey], prefix.length === 0 ? schemaKey : "".concat(prefix, ".").concat(schemaKey), errors);
        result = result && isSubValueSchemeMatched;
    }
    return result;
}
