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

const fr_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis`)
};

const ar_issue_issueddate1 = /** @type {(inputs: Issue_Issueddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدرت`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Issue_Issueddate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_issueddate1 = /** @type {((inputs?: Issue_Issueddate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Issueddate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_issueddate1(inputs)
	if (locale === "es") return es_issue_issueddate1(inputs)
	if (locale === "fr") return fr_issue_issueddate1(inputs)
	return ar_issue_issueddate1(inputs)
});
export { issue_issueddate1 as "issue.issuedDate" }