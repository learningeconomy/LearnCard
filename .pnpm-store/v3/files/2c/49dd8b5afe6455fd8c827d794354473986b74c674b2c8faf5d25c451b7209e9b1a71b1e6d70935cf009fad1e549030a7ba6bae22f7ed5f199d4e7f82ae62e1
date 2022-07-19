"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNamedTupleMember = exports.getExportsForStatement = exports.resolveIdentifier = exports.getExportsForSourceFile = exports.getDeclarationsForSymbol = exports.isNamespaceStatement = exports.isDeclareGlobalStatement = exports.isDeclareModule = exports.isAmbientModule = exports.splitTransientSymbol = exports.getDeclarationNameSymbol = exports.getActualSymbol = exports.getNodeName = exports.hasNodeModifier = exports.isNodeNamedDeclaration = void 0;
var ts = require("typescript");
var namedDeclarationKinds = [
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.EnumDeclaration,
    ts.SyntaxKind.TypeAliasDeclaration,
    ts.SyntaxKind.ModuleDeclaration,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.VariableDeclaration,
    ts.SyntaxKind.PropertySignature,
];
function isNodeNamedDeclaration(node) {
    return namedDeclarationKinds.indexOf(node.kind) !== -1;
}
exports.isNodeNamedDeclaration = isNodeNamedDeclaration;
function hasNodeModifier(node, modifier) {
    return Boolean(node.modifiers && node.modifiers.some(function (nodeModifier) { return nodeModifier.kind === modifier; }));
}
exports.hasNodeModifier = hasNodeModifier;
function getNodeName(node) {
    var _a;
    var nodeName = node.name;
    if (nodeName === undefined) {
        var defaultModifier = (_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.find(function (mod) { return mod.kind === ts.SyntaxKind.DefaultKeyword; });
        if (defaultModifier !== undefined) {
            return defaultModifier;
        }
    }
    return nodeName;
}
exports.getNodeName = getNodeName;
function getActualSymbol(symbol, typeChecker) {
    if (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = typeChecker.getAliasedSymbol(symbol);
    }
    return symbol;
}
exports.getActualSymbol = getActualSymbol;
function getDeclarationNameSymbol(name, typeChecker) {
    var symbol = typeChecker.getSymbolAtLocation(name);
    if (symbol === undefined) {
        return null;
    }
    return getActualSymbol(symbol, typeChecker);
}
exports.getDeclarationNameSymbol = getDeclarationNameSymbol;
function splitTransientSymbol(symbol, typeChecker) {
    // actually I think we even don't need to operate/use "Transient" symbols anywhere
    // it's kind of aliased symbol, but just merged
    // but it's hard to refractor everything to use array of symbols instead of just symbol
    // so let's fix it for some places
    if ((symbol.flags & ts.SymbolFlags.Transient) === 0) {
        return [symbol];
    }
    // "Transient" symbol is kinda "merged" symbol
    // I don't really know is this way to "split" is correct
    // but it seems that it works for now ¯\_(ツ)_/¯
    var declarations = getDeclarationsForSymbol(symbol);
    var result = [];
    for (var _i = 0, declarations_1 = declarations; _i < declarations_1.length; _i++) {
        var declaration = declarations_1[_i];
        if (!isNodeNamedDeclaration(declaration) || declaration.name === undefined) {
            continue;
        }
        var sym = typeChecker.getSymbolAtLocation(declaration.name);
        if (sym === undefined) {
            continue;
        }
        result.push(getActualSymbol(sym, typeChecker));
    }
    return result;
}
exports.splitTransientSymbol = splitTransientSymbol;
/**
 * @see https://github.com/Microsoft/TypeScript/blob/f7c4fefeb62416c311077a699cc15beb211c25c9/src/compiler/utilities.ts#L626-L628
 */
function isGlobalScopeAugmentation(module) {
    return Boolean(module.flags & ts.NodeFlags.GlobalAugmentation);
}
/**
 * Returns whether node is ambient module declaration (declare module "name" or declare global)
 * @see https://github.com/Microsoft/TypeScript/blob/f7c4fefeb62416c311077a699cc15beb211c25c9/src/compiler/utilities.ts#L588-L590
 */
function isAmbientModule(node) {
    return ts.isModuleDeclaration(node) && (node.name.kind === ts.SyntaxKind.StringLiteral || isGlobalScopeAugmentation(node));
}
exports.isAmbientModule = isAmbientModule;
/**
 * Returns whether node is `declare module` ModuleDeclaration (not `declare global` or `namespace`)
 */
function isDeclareModule(node) {
    // `declare module ""`, `declare global` and `namespace {}` are ModuleDeclaration
    // but here we need to check only `declare module` statements
    return ts.isModuleDeclaration(node) && !(node.flags & ts.NodeFlags.Namespace) && !isGlobalScopeAugmentation(node);
}
exports.isDeclareModule = isDeclareModule;
/**
 * Returns whether statement is `declare global` ModuleDeclaration
 */
function isDeclareGlobalStatement(statement) {
    return ts.isModuleDeclaration(statement) && isGlobalScopeAugmentation(statement);
}
exports.isDeclareGlobalStatement = isDeclareGlobalStatement;
/**
 * Returns whether node is `namespace` ModuleDeclaration
 */
function isNamespaceStatement(node) {
    return ts.isModuleDeclaration(node) && Boolean(node.flags & ts.NodeFlags.Namespace);
}
exports.isNamespaceStatement = isNamespaceStatement;
function getDeclarationsForSymbol(symbol) {
    var result = [];
    // Disabling tslint is for backward compat with TypeScript < 3
    // tslint:disable-next-line:strict-type-predicates
    if (symbol.declarations !== undefined) {
        result.push.apply(result, symbol.declarations);
    }
    // Disabling tslint is for backward compat with TypeScript < 3
    // tslint:disable-next-line:strict-type-predicates
    if (symbol.valueDeclaration !== undefined) {
        // push valueDeclaration might be already in declarations array
        // so let's check first to avoid duplication nodes
        if (!result.includes(symbol.valueDeclaration)) {
            result.push(symbol.valueDeclaration);
        }
    }
    return result;
}
exports.getDeclarationsForSymbol = getDeclarationsForSymbol;
function getExportsForSourceFile(typeChecker, sourceFileSymbol) {
    if (sourceFileSymbol.exports !== undefined) {
        var commonJsExport = sourceFileSymbol.exports.get(ts.InternalSymbolName.ExportEquals);
        if (commonJsExport !== undefined) {
            var symbol = getActualSymbol(commonJsExport, typeChecker);
            return [
                {
                    symbol: symbol,
                    type: 0 /* ExportType.CommonJS */,
                    exportedName: '',
                    originalName: symbol.escapedName,
                },
            ];
        }
    }
    var result = typeChecker
        .getExportsOfModule(sourceFileSymbol)
        .map(function (symbol) { return ({ symbol: symbol, exportedName: symbol.escapedName, type: 1 /* ExportType.ES6Named */, originalName: '' }); });
    if (sourceFileSymbol.exports !== undefined) {
        var defaultExportSymbol_1 = sourceFileSymbol.exports.get(ts.InternalSymbolName.Default);
        if (defaultExportSymbol_1 !== undefined) {
            var defaultExport = result.find(function (exp) { return exp.symbol === defaultExportSymbol_1; });
            if (defaultExport !== undefined) {
                defaultExport.type = 2 /* ExportType.ES6Default */;
            }
            else {
                // it seems that default export is always returned by getExportsOfModule
                // but let's add it to be sure add if there is no such export
                result.push({
                    symbol: defaultExportSymbol_1,
                    type: 2 /* ExportType.ES6Default */,
                    exportedName: 'default',
                    originalName: '',
                });
            }
        }
    }
    result.forEach(function (exp) {
        exp.symbol = getActualSymbol(exp.symbol, typeChecker);
        var resolvedIdentifier = resolveIdentifierBySymbol(exp.symbol);
        exp.originalName = resolvedIdentifier !== undefined ? resolvedIdentifier.getText() : exp.symbol.escapedName;
    });
    return result;
}
exports.getExportsForSourceFile = getExportsForSourceFile;
function resolveIdentifier(typeChecker, identifier) {
    var symbol = getDeclarationNameSymbol(identifier, typeChecker);
    if (symbol === null) {
        return undefined;
    }
    return resolveIdentifierBySymbol(symbol);
}
exports.resolveIdentifier = resolveIdentifier;
function resolveIdentifierBySymbol(identifierSymbol) {
    var declarations = getDeclarationsForSymbol(identifierSymbol);
    if (declarations.length === 0) {
        return undefined;
    }
    var decl = declarations[0];
    if (!isNodeNamedDeclaration(decl)) {
        return undefined;
    }
    return decl.name;
}
function getExportsForStatement(exportedSymbols, typeChecker, statement) {
    if (ts.isVariableStatement(statement)) {
        if (statement.declarationList.declarations.length === 0) {
            return [];
        }
        var firstDeclarationExports_1 = getExportsForName(exportedSymbols, typeChecker, statement.declarationList.declarations[0].name);
        var allDeclarationsHaveSameExportType = statement.declarationList.declarations.every(function (variableDecl) {
            var _a, _b;
            // all declaration should have the same export type
            // TODO: for now it's not supported to have different type of exports
            return ((_a = getExportsForName(exportedSymbols, typeChecker, variableDecl.name)[0]) === null || _a === void 0 ? void 0 : _a.type) === ((_b = firstDeclarationExports_1[0]) === null || _b === void 0 ? void 0 : _b.type);
        });
        if (!allDeclarationsHaveSameExportType) {
            // log warn?
            return [];
        }
        return firstDeclarationExports_1;
    }
    var nodeName = getNodeName(statement);
    if (nodeName === undefined) {
        return [];
    }
    return getExportsForName(exportedSymbols, typeChecker, nodeName);
}
exports.getExportsForStatement = getExportsForStatement;
function getExportsForName(exportedSymbols, typeChecker, name) {
    if (ts.isArrayBindingPattern(name) || ts.isObjectBindingPattern(name)) {
        // TODO: binding patterns in variable declarations are not supported for now
        // see https://github.com/microsoft/TypeScript/issues/30598 also
        return [];
    }
    var declarationSymbol = typeChecker.getSymbolAtLocation(name);
    return exportedSymbols.filter(function (rootExport) { return rootExport.symbol === declarationSymbol; });
}
function isNamedTupleMember(node) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    var compatTs = ts;
    if (!compatTs.isNamedTupleMember) {
        return false;
    }
    return compatTs.isNamedTupleMember(node);
}
exports.isNamedTupleMember = isNamedTupleMember;
