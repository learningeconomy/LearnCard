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
import { once } from '@storybook/client-logger';
import { instrument } from '@storybook/instrumenter';
import * as domTestingLibrary from '@testing-library/dom';
import _userEvent from '@testing-library/user-event';
import dedent from 'ts-dedent';
var debugOptions = {
    timeout: 2147483647,
    interval: 2147483647,
};
var testingLibrary = instrument(__assign({}, domTestingLibrary), {
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
            once.warn(dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          You are using Testing Library's `screen` object. Use `within(canvasElement)` instead.\n          More info: https://storybook.js.org/docs/react/essentials/interactions\n        "], ["\n          You are using Testing Library's \\`screen\\` object. Use \\`within(canvasElement)\\` instead.\n          More info: https://storybook.js.org/docs/react/essentials/interactions\n        "]))));
            return val;
        },
    });
}, __assign({}, testingLibrary.screen));
export var buildQueries = testingLibrary.buildQueries, configure = testingLibrary.configure, createEvent = testingLibrary.createEvent, findAllByAltText = testingLibrary.findAllByAltText, findAllByDisplayValue = testingLibrary.findAllByDisplayValue, findAllByLabelText = testingLibrary.findAllByLabelText, findAllByPlaceholderText = testingLibrary.findAllByPlaceholderText, findAllByRole = testingLibrary.findAllByRole, findAllByTestId = testingLibrary.findAllByTestId, findAllByText = testingLibrary.findAllByText, findAllByTitle = testingLibrary.findAllByTitle, findByAltText = testingLibrary.findByAltText, findByDisplayValue = testingLibrary.findByDisplayValue, findByLabelText = testingLibrary.findByLabelText, findByPlaceholderText = testingLibrary.findByPlaceholderText, findByRole = testingLibrary.findByRole, findByTestId = testingLibrary.findByTestId, findByText = testingLibrary.findByText, findByTitle = testingLibrary.findByTitle, fireEvent = testingLibrary.fireEvent, getAllByAltText = testingLibrary.getAllByAltText, getAllByDisplayValue = testingLibrary.getAllByDisplayValue, getAllByLabelText = testingLibrary.getAllByLabelText, getAllByPlaceholderText = testingLibrary.getAllByPlaceholderText, getAllByRole = testingLibrary.getAllByRole, getAllByTestId = testingLibrary.getAllByTestId, getAllByText = testingLibrary.getAllByText, getAllByTitle = testingLibrary.getAllByTitle, getByAltText = testingLibrary.getByAltText, getByDisplayValue = testingLibrary.getByDisplayValue, getByLabelText = testingLibrary.getByLabelText, getByPlaceholderText = testingLibrary.getByPlaceholderText, getByRole = testingLibrary.getByRole, getByTestId = testingLibrary.getByTestId, getByText = testingLibrary.getByText, getByTitle = testingLibrary.getByTitle, getConfig = testingLibrary.getConfig, getDefaultNormalizer = testingLibrary.getDefaultNormalizer, getElementError = testingLibrary.getElementError, getNodeText = testingLibrary.getNodeText, getQueriesForElement = testingLibrary.getQueriesForElement, getRoles = testingLibrary.getRoles, getSuggestedQuery = testingLibrary.getSuggestedQuery, isInaccessible = testingLibrary.isInaccessible, logDOM = testingLibrary.logDOM, logRoles = testingLibrary.logRoles, prettyDOM = testingLibrary.prettyDOM, queries = testingLibrary.queries, queryAllByAltText = testingLibrary.queryAllByAltText, queryAllByAttribute = testingLibrary.queryAllByAttribute, queryAllByDisplayValue = testingLibrary.queryAllByDisplayValue, queryAllByLabelText = testingLibrary.queryAllByLabelText, queryAllByPlaceholderText = testingLibrary.queryAllByPlaceholderText, queryAllByRole = testingLibrary.queryAllByRole, queryAllByTestId = testingLibrary.queryAllByTestId, queryAllByText = testingLibrary.queryAllByText, queryAllByTitle = testingLibrary.queryAllByTitle, queryByAltText = testingLibrary.queryByAltText, queryByAttribute = testingLibrary.queryByAttribute, queryByDisplayValue = testingLibrary.queryByDisplayValue, queryByLabelText = testingLibrary.queryByLabelText, queryByPlaceholderText = testingLibrary.queryByPlaceholderText, queryByRole = testingLibrary.queryByRole, queryByTestId = testingLibrary.queryByTestId, queryByText = testingLibrary.queryByText, queryByTitle = testingLibrary.queryByTitle, queryHelpers = testingLibrary.queryHelpers, screen = testingLibrary.screen, waitFor = testingLibrary.waitFor, waitForElementToBeRemoved = testingLibrary.waitForElementToBeRemoved, within = testingLibrary.within, prettyFormat = testingLibrary.prettyFormat;
export var userEvent = instrument({ userEvent: _userEvent }, { intercept: true }).userEvent;
var templateObject_1;
