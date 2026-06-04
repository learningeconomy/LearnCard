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

const de_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausgestellt`)
};

const ar_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدرت`)
};

const fr_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis`)
};

const ko_issue_issued = /** @type {(inputs: Issue_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`발급됨`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Issue_IssuedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_issued = /** @type {((inputs?: Issue_IssuedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_IssuedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_issued(inputs)
	if (locale === "es") return es_issue_issued(inputs)
	if (locale === "de") return de_issue_issued(inputs)
	if (locale === "ar") return ar_issue_issued(inputs)
	if (locale === "fr") return fr_issue_issued(inputs)
	return ko_issue_issued(inputs)
});
export { issue_issued as "issue.issued" }