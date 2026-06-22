/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_SuspendInputs */

const en_issue_suspend = /** @type {(inputs: Issue_SuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspend`)
};

const es_issue_suspend = /** @type {(inputs: Issue_SuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspender`)
};

const fr_issue_suspend = /** @type {(inputs: Issue_SuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspendre`)
};

const ar_issue_suspend = /** @type {(inputs: Issue_SuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعليق`)
};

/**
* | output |
* | --- |
* | "Suspend" |
*
* @param {Issue_SuspendInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_suspend = /** @type {((inputs?: Issue_SuspendInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_SuspendInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_suspend(inputs)
	if (locale === "es") return es_issue_suspend(inputs)
	if (locale === "fr") return fr_issue_suspend(inputs)
	return ar_issue_suspend(inputs)
});
export { issue_suspend as "issue.suspend" }