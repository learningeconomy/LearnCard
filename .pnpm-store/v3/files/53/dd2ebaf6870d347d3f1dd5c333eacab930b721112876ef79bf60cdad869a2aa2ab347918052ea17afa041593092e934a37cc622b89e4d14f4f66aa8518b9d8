"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAllByAttribute = exports.queryAllByAltText = exports.queries = exports.prettyDOM = exports.logRoles = exports.logDOM = exports.isInaccessible = exports.getSuggestedQuery = exports.getRoles = exports.getQueriesForElement = exports.getNodeText = exports.getElementError = exports.getDefaultNormalizer = exports.getConfig = exports.getByTitle = exports.getByText = exports.getByTestId = exports.getByRole = exports.getByPlaceholderText = exports.getByLabelText = exports.getByDisplayValue = exports.getByAltText = exports.getAllByTitle = exports.getAllByText = exports.getAllByTestId = exports.getAllByRole = exports.getAllByPlaceholderText = exports.getAllByLabelText = exports.getAllByDisplayValue = exports.getAllByAltText = exports.fireEvent = exports.findByTitle = exports.findByText = exports.findByTestId = exports.findByRole = exports.findByPlaceholderText = exports.findByLabelText = exports.findByDisplayValue = exports.findByAltText = exports.findAllByTitle = exports.findAllByText = exports.findAllByTestId = exports.findAllByRole = exports.findAllByPlaceholderText = exports.findAllByLabelText = exports.findAllByDisplayValue = exports.findAllByAltText = exports.createEvent = exports.configure = exports.buildQueries = void 0;
exports.userEvent = exports.prettyFormat = exports.within = exports.waitForElementToBeRemoved = exports.waitFor = exports.screen = exports.queryHelpers = exports.queryByTitle = exports.queryByText = exports.queryByTestId = exports.queryByRole = exports.queryByPlaceholderText = exports.queryByLabelText = exports.queryByDisplayValue = exports.queryByAttribute = exports.queryByAltText = exports.queryAllByTitle = exports.queryAllByText = exports.queryAllByTestId = exports.queryAllByRole = exports.queryAllByPlaceholderText = exports.queryAllByLabelText = exports.queryAllByDisplayValue = void 0;
var client_logger_1 = require("@storybook/client-logger");
var instrumenter_1 = require("@storybook/instrumenter");
var domTestingLibrary = require("@testing-library/dom");
var user_event_1 = require("@testing-library/user-event");
var ts_dedent_1 = require("ts-dedent");
var debugOptions = {
    timeout: 2147483647,
    interval: 2147483647,
};
var testingLibrary = (0, instrumenter_1.instrument)(__assign({}, domTestingLibrary), {
    intercept: function (method, path) { return path[0] === 'fireEvent' || method.startsWith('findBy'); },
    getArgs: function (call, state) {
        if (!state.isDebugging)
            return call.args;
        if (call.method.startsWith('findBy')) {
            var _a = call.args, value = _a[0], queryOptions = _a[1], waitForOptions = _a[2];
            return [value, queryOptions, __assign(__assign({}, waitForOptions), debugOptions)];
        }
        if (call.method.startsWith('waitFor')) {
            var _b = call.args, callback = _b[0], options = _b[1];
            return [callback, __assign(__assign({}, options), debugOptions)];
        }
        return call.args;
    },
});
testingLibrary.screen = Object.entries(testingLibrary.screen).reduce(function (acc, _a) {
    var key = _a[0], val = _a[1];
    return Object.defineProperty(acc, key, {
        get: function () {
            client_logger_1.once.warn((0, ts_dedent_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          You are using Testing Library's `screen` object. Use `within(canvasElement)` instead.\n          More info: https://storybook.js.org/docs/react/essentials/interactions\n        "], ["\n          You are using Testing Library's \\`screen\\` object. Use \\`within(canvasElement)\\` instead.\n          More info: https://storybook.js.org/docs/react/essentials/interactions\n        "]))));
            return val;
        },
    });
}, __assign({}, testingLibrary.screen));
exports.buildQueries = testingLibrary.buildQueries, exports.configure = testingLibrary.configure, exports.createEvent = testingLibrary.createEvent, exports.findAllByAltText = testingLibrary.findAllByAltText, exports.findAllByDisplayValue = testingLibrary.findAllByDisplayValue, exports.findAllByLabelText = testingLibrary.findAllByLabelText, exports.findAllByPlaceholderText = testingLibrary.findAllByPlaceholderText, exports.findAllByRole = testingLibrary.findAllByRole, exports.findAllByTestId = testingLibrary.findAllByTestId, exports.findAllByText = testingLibrary.findAllByText, exports.findAllByTitle = testingLibrary.findAllByTitle, exports.findByAltText = testingLibrary.findByAltText, exports.findByDisplayValue = testingLibrary.findByDisplayValue, exports.findByLabelText = testingLibrary.findByLabelText, exports.findByPlaceholderText = testingLibrary.findByPlaceholderText, exports.findByRole = testingLibrary.findByRole, exports.findByTestId = testingLibrary.findByTestId, exports.findByText = testingLibrary.findByText, exports.findByTitle = testingLibrary.findByTitle, exports.fireEvent = testingLibrary.fireEvent, exports.getAllByAltText = testingLibrary.getAllByAltText, exports.getAllByDisplayValue = testingLibrary.getAllByDisplayValue, exports.getAllByLabelText = testingLibrary.getAllByLabelText, exports.getAllByPlaceholderText = testingLibrary.getAllByPlaceholderText, exports.getAllByRole = testingLibrary.getAllByRole, exports.getAllByTestId = testingLibrary.getAllByTestId, exports.getAllByText = testingLibrary.getAllByText, exports.getAllByTitle = testingLibrary.getAllByTitle, exports.getByAltText = testingLibrary.getByAltText, exports.getByDisplayValue = testingLibrary.getByDisplayValue, exports.getByLabelText = testingLibrary.getByLabelText, exports.getByPlaceholderText = testingLibrary.getByPlaceholderText, exports.getByRole = testingLibrary.getByRole, exports.getByTestId = testingLibrary.getByTestId, exports.getByText = testingLibrary.getByText, exports.getByTitle = testingLibrary.getByTitle, exports.getConfig = testingLibrary.getConfig, exports.getDefaultNormalizer = testingLibrary.getDefaultNormalizer, exports.getElementError = testingLibrary.getElementError, exports.getNodeText = testingLibrary.getNodeText, exports.getQueriesForElement = testingLibrary.getQueriesForElement, exports.getRoles = testingLibrary.getRoles, exports.getSuggestedQuery = testingLibrary.getSuggestedQuery, exports.isInaccessible = testingLibrary.isInaccessible, exports.logDOM = testingLibrary.logDOM, exports.logRoles = testingLibrary.logRoles, exports.prettyDOM = testingLibrary.prettyDOM, exports.queries = testingLibrary.queries, exports.queryAllByAltText = testingLibrary.queryAllByAltText, exports.queryAllByAttribute = testingLibrary.queryAllByAttribute, exports.queryAllByDisplayValue = testingLibrary.queryAllByDisplayValue, exports.queryAllByLabelText = testingLibrary.queryAllByLabelText, exports.queryAllByPlaceholderText = testingLibrary.queryAllByPlaceholderText, exports.queryAllByRole = testingLibrary.queryAllByRole, exports.queryAllByTestId = testingLibrary.queryAllByTestId, exports.queryAllByText = testingLibrary.queryAllByText, exports.queryAllByTitle = testingLibrary.queryAllByTitle, exports.queryByAltText = testingLibrary.queryByAltText, exports.queryByAttribute = testingLibrary.queryByAttribute, exports.queryByDisplayValue = testingLibrary.queryByDisplayValue, exports.queryByLabelText = testingLibrary.queryByLabelText, exports.queryByPlaceholderText = testingLibrary.queryByPlaceholderText, exports.queryByRole = testingLibrary.queryByRole, exports.queryByTestId = testingLibrary.queryByTestId, exports.queryByText = testingLibrary.queryByText, exports.queryByTitle = testingLibrary.queryByTitle, exports.queryHelpers = testingLibrary.queryHelpers, exports.screen = testingLibrary.screen, exports.waitFor = testingLibrary.waitFor, exports.waitForElementToBeRemoved = testingLibrary.waitForElementToBeRemoved, exports.within = testingLibrary.within, exports.prettyFormat = testingLibrary.prettyFormat;
exports.userEvent = (0, instrumenter_1.instrument)({ userEvent: user_event_1.default }, { intercept: true }).userEvent;
var templateObject_1;
