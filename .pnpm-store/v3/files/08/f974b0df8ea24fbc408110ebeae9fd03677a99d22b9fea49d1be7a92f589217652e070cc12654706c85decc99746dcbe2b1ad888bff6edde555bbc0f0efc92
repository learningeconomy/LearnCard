"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDiagnosticsErrors = exports.checkProgramDiagnosticsErrors = void 0;
var ts = require("typescript");
var logger_1 = require("../logger");
var formatDiagnosticsHost = {
    getCanonicalFileName: function (fileName) { return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(); },
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: function () { return ts.sys.newLine; },
};
function checkProgramDiagnosticsErrors(program) {
    checkDiagnosticsErrors(ts.getPreEmitDiagnostics(program), 'Compiled with errors');
    checkDiagnosticsErrors(program.getDeclarationDiagnostics(), 'Compiled with errors');
}
exports.checkProgramDiagnosticsErrors = checkProgramDiagnosticsErrors;
function checkDiagnosticsErrors(diagnostics, failMessage) {
    if (diagnostics.length === 0) {
        return;
    }
    (0, logger_1.errorLog)(ts.formatDiagnostics(diagnostics, formatDiagnosticsHost).trim());
    throw new Error(failMessage);
}
exports.checkDiagnosticsErrors = checkDiagnosticsErrors;
