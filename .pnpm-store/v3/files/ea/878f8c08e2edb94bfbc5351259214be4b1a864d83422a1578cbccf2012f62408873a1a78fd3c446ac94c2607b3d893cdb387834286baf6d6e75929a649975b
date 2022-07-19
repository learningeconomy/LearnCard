"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureTime = void 0;
/**
 * @param param function to execute
 * @returns execution time (in milliseconds)
 */
function measureTime(func) {
    var startAt = process.hrtime();
    func();
    var resultValue = process.hrtime(startAt);
    return secondsToMs(resultValue[0]) + nanosecondsToMs(resultValue[1]);
}
exports.measureTime = measureTime;
function secondsToMs(value) {
    return value * 1000;
}
function nanosecondsToMs(value) {
    return value / 1000000;
}
