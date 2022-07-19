"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypesUsageEvaluator = void 0;
var ts = require("typescript");
var typescript_1 = require("./helpers/typescript");
var TypesUsageEvaluator = /** @class */ (function () {
    function TypesUsageEvaluator(files, typeChecker) {
        this.nodesParentsMap = new Map();
        this.typeChecker = typeChecker;
        this.computeUsages(files);
    }
    TypesUsageEvaluator.prototype.isSymbolUsedBySymbol = function (symbol, by) {
        return this.isSymbolUsedBySymbolImpl(this.getActualSymbol(symbol), this.getActualSymbol(by), new Set());
    };
    TypesUsageEvaluator.prototype.getSymbolsUsingSymbol = function (symbol) {
        return this.nodesParentsMap.get(this.getActualSymbol(symbol)) || null;
    };
    TypesUsageEvaluator.prototype.isSymbolUsedBySymbolImpl = function (fromSymbol, toSymbol, visitedSymbols) {
        if (fromSymbol === toSymbol) {
            return true;
        }
        var reachableNodes = this.nodesParentsMap.get(fromSymbol);
        if (reachableNodes !== undefined) {
            for (var _i = 0, _a = Array.from(reachableNodes); _i < _a.length; _i++) {
                var symbol = _a[_i];
                if (visitedSymbols.has(symbol)) {
                    continue;
                }
                visitedSymbols.add(symbol);
                if (this.isSymbolUsedBySymbolImpl(symbol, toSymbol, visitedSymbols)) {
                    return true;
                }
            }
        }
        visitedSymbols.add(fromSymbol);
        return false;
    };
    TypesUsageEvaluator.prototype.computeUsages = function (files) {
        this.nodesParentsMap.clear();
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            ts.forEachChild(file, this.computeUsageForNode.bind(this));
        }
    };
    TypesUsageEvaluator.prototype.computeUsageForNode = function (node) {
        if ((0, typescript_1.isDeclareModule)(node) && node.body !== undefined && ts.isModuleBlock(node.body)) {
            for (var _i = 0, _a = node.body.statements; _i < _a.length; _i++) {
                var statement = _a[_i];
                this.computeUsageForNode(statement);
            }
        }
        else if ((0, typescript_1.isNodeNamedDeclaration)(node) && node.name) {
            var childSymbol = this.getSymbol(node.name);
            this.computeUsagesRecursively(node, childSymbol);
        }
        else if (ts.isVariableStatement(node)) {
            for (var _b = 0, _c = node.declarationList.declarations; _b < _c.length; _b++) {
                var varDeclaration = _c[_b];
                this.computeUsageForNode(varDeclaration);
            }
        }
    };
    TypesUsageEvaluator.prototype.computeUsagesRecursively = function (parent, parentSymbol) {
        var queue = parent.getChildren();
        for (var _i = 0, queue_1 = queue; _i < queue_1.length; _i++) {
            var child = queue_1[_i];
            if (child.kind === ts.SyntaxKind.JSDocComment) {
                continue;
            }
            queue.push.apply(queue, child.getChildren());
            if (ts.isIdentifier(child)) {
                // identifiers in labelled tuples don't have symbols for their labels
                // so let's just skip them from collecting
                // since this feature is for TypeScript > 4, we have to check that a function exist before accessing it
                if ((0, typescript_1.isNamedTupleMember)(child.parent) && child.parent.name === child) {
                    continue;
                }
                var childSymbols = (0, typescript_1.splitTransientSymbol)(this.getSymbol(child), this.typeChecker);
                for (var _a = 0, childSymbols_1 = childSymbols; _a < childSymbols_1.length; _a++) {
                    var childSymbol = childSymbols_1[_a];
                    var symbols = this.nodesParentsMap.get(childSymbol);
                    if (symbols === undefined) {
                        symbols = new Set();
                        this.nodesParentsMap.set(childSymbol, symbols);
                    }
                    // to avoid infinite recursion
                    if (childSymbol !== parentSymbol) {
                        symbols.add(parentSymbol);
                    }
                }
            }
        }
    };
    TypesUsageEvaluator.prototype.getSymbol = function (node) {
        var nodeSymbol = this.typeChecker.getSymbolAtLocation(node);
        if (nodeSymbol === undefined) {
            throw new Error("Cannot find symbol for node: ".concat(node.getText()));
        }
        return this.getActualSymbol(nodeSymbol);
    };
    TypesUsageEvaluator.prototype.getActualSymbol = function (symbol) {
        return (0, typescript_1.getActualSymbol)(symbol, this.typeChecker);
    };
    return TypesUsageEvaluator;
}());
exports.TypesUsageEvaluator = TypesUsageEvaluator;
