"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preOffline = void 0;
const path_1 = require("path");
const ramda_1 = require("ramda");
function preOffline() {
    var _a, _b, _c, _d;
    // Set offline location automatically if not set manually
    if (!((_d = (_c = (_b = (_a = this.serverless) === null || _a === void 0 ? void 0 : _a.service) === null || _b === void 0 ? void 0 : _b.custom) === null || _c === void 0 ? void 0 : _c['serverless-offline']) === null || _d === void 0 ? void 0 : _d.location)) {
        const newServerless = (0, ramda_1.assocPath)(['service', 'custom', 'serverless-offline', 'location'], (0, path_1.relative)(this.serviceDirPath, this.buildDirPath), this.serverless);
        this.serverless.service.custom = newServerless.service.custom;
    }
}
exports.preOffline = preOffline;
