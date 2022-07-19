"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preLocal = void 0;
function preLocal() {
    this.serviceDirPath = this.buildDirPath;
    this.serverless.config.servicePath = this.buildDirPath;
    // If this is a node function set the service path as CWD to allow accessing bundled files correctly
    if (this.functions[this.options.function]) {
        process.chdir(this.serviceDirPath);
    }
}
exports.preLocal = preLocal;
