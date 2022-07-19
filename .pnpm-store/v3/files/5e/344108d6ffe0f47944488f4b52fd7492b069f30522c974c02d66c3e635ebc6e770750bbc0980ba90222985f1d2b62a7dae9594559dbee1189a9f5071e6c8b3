"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypesLibraryName = exports.getLibraryName = void 0;
var nodeModulesFolderName = 'node_modules/';
var libraryNameRegex = /node_modules\/((?:(?=@)[^/]+\/[^/]+|[^/]+))\//;
function getLibraryName(fileName) {
    var lastNodeModulesIndex = fileName.lastIndexOf(nodeModulesFolderName);
    if (lastNodeModulesIndex === -1) {
        return null;
    }
    var match = libraryNameRegex.exec(fileName.slice(lastNodeModulesIndex));
    if (match === null) {
        return null;
    }
    return match[1];
}
exports.getLibraryName = getLibraryName;
function getTypesLibraryName(path) {
    var libraryName = getLibraryName(path);
    if (libraryName === null) {
        return null;
    }
    var typesFolderPrefix = '@types/';
    if (!libraryName.startsWith(typesFolderPrefix)) {
        return null;
    }
    return libraryName.substring(typesFolderPrefix.length);
}
exports.getTypesLibraryName = getTypesLibraryName;
