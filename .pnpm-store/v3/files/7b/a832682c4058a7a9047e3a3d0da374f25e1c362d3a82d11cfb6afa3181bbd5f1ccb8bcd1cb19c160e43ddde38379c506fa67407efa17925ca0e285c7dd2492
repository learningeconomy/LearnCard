"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbsolutePath = void 0;
var path = require("path");
var process = require("process");
var fix_path_1 = require("./fix-path");
function getAbsolutePath(fileName, cwd) {
    if (!path.isAbsolute(fileName)) {
        fileName = path.join(cwd !== undefined ? cwd : process.cwd(), fileName);
    }
    return (0, fix_path_1.fixPath)(fileName);
}
exports.getAbsolutePath = getAbsolutePath;
