/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_IssuedInputs */

const en_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued`)
};

const es_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitidas`)
};

const fr_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis`)
};

const ar_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدرت`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Issue_IssuedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_issued = /** @type {((inputs?: Issue_IssuedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_IssuedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_issued(inputs)
	if (locale === "es") return es_issue_issued(inputs)
	if (locale === "fr") return fr_issue_issued(inputs)
	return ar_issue_issued(inputs)
});
export { issue_issued as "issue.issued" }