/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_SuspendedInputs */

const en_issue_suspended = /** @type {(inputs: Issue_SuspendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspended`)
};

const es_issue_suspended = /** @type {(inputs: Issue_SuspendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspendidas`)
};

const fr_issue_suspended = /** @type {(inputs: Issue_SuspendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspendus`)
};

const ar_issue_suspended = /** @type {(inputs: Issue_SuspendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلقة`)
};

/**
* | output |
* | --- |
* | "Suspended" |
*
* @param {Issue_SuspendedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_suspended = /** @type {((inputs?: Issue_SuspendedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_SuspendedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_suspended(inputs)
	if (locale === "es") return es_issue_suspended(inputs)
	if (locale === "fr") return fr_issue_suspended(inputs)
	return ar_issue_suspended(inputs)
});
export { issue_suspended as "issue.suspended" }