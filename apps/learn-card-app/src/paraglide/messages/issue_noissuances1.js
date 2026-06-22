/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Noissuances1Inputs */

const en_issue_noissuances1 = /** @type {(inputs: Issue_Noissuances1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials issued yet`)
};

const es_issue_noissuances1 = /** @type {(inputs: Issue_Noissuances1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay credenciales emitidas`)
};

const fr_issue_noissuances1 = /** @type {(inputs: Issue_Noissuances1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun titre émis pour le moment`)
};

const ar_issue_noissuances1 = /** @type {(inputs: Issue_Noissuances1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم إصدار شهادات بعد`)
};

/**
* | output |
* | --- |
* | "No credentials issued yet" |
*
* @param {Issue_Noissuances1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_noissuances1 = /** @type {((inputs?: Issue_Noissuances1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Noissuances1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_noissuances1(inputs)
	if (locale === "es") return es_issue_noissuances1(inputs)
	if (locale === "fr") return fr_issue_noissuances1(inputs)
	return ar_issue_noissuances1(inputs)
});
export { issue_noissuances1 as "issue.noIssuances" }