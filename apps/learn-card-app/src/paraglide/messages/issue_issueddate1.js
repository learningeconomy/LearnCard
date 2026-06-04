/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Issueddate1Inputs */

const en_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued`)
};

const es_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitida`)
};

const de_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausgestellt`)
};

const ar_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدرت`)
};

const fr_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis`)
};

const ko_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`발급됨`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Issue_Issueddate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_issueddate1 = /** @type {((inputs?: Issue_Issueddate1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Issueddate1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_issueddate1(inputs)
	if (locale === "es") return es_issue_issueddate1(inputs)
	if (locale === "de") return de_issue_issueddate1(inputs)
	if (locale === "ar") return ar_issue_issueddate1(inputs)
	if (locale === "fr") return fr_issue_issueddate1(inputs)
	return ko_issue_issueddate1(inputs)
});
export { issue_issueddate1 as "issue.issuedDate" }