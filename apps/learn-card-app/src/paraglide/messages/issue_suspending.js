/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_SuspendingInputs */

const en_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspending...`)
};

const es_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspendiendo...`)
};

const fr_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspension...`)
};

const ar_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التعليق...`)
};

/**
* | output |
* | --- |
* | "Suspending..." |
*
* @param {Issue_SuspendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_suspending = /** @type {((inputs?: Issue_SuspendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_SuspendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_suspending(inputs)
	if (locale === "es") return es_issue_suspending(inputs)
	if (locale === "fr") return fr_issue_suspending(inputs)
	return ar_issue_suspending(inputs)
});
export { issue_suspending as "issue.suspending" }