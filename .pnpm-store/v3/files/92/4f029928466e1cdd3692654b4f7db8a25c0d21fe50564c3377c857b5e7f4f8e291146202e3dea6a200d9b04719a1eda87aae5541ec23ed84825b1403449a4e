"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageVersion = void 0;
var fs = require("fs");
var path = require("path");
function packageVersion() {
    var dirName = __dirname;
    while (dirName.length !== 0) {
        var packageJsonFilePath = path.join(dirName, 'package.json');
        if (fs.existsSync(packageJsonFilePath)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-var-requires
            return require(packageJsonFilePath).version;
        }
        dirName = path.join(dirName, '..');
    }
    throw new Error("Cannot find up package.json in ".concat(__dirname));
}
exports.packageVersion = packageVersion;
