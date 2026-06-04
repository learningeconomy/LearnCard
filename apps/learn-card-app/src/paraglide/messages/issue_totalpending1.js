/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Totalpending1Inputs */

const en_issue_totalpending1 = /** @type {(inputs: Issue_Totalpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total Pending`)
};

const es_issue_totalpending1 = /** @type {(inputs: Issue_Totalpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total pendientes`)
};

const de_issue_totalpending1 = /** @type {(inputs: Issue_Totalpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gesamt ausstehend`)
};

const ar_issue_totalpending1 = /** @type {(inputs: Issue_Totalpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجمالي قيد الانتظار`)
};

const fr_issue_totalpending1 = /** @type {(inputs: Issue_Totalpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total en attente`)
};

const ko_issue_totalpending1 = /** @type {(inputs: Issue_Totalpending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`총 대기 중`)
};

/**
* | output |
* | --- |
* | "Total Pending" |
*
* @param {Issue_Totalpending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_totalpending1 = /** @type {((inputs?: Issue_Totalpending1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Totalpending1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_totalpending1(inputs)
	if (locale === "es") return es_issue_totalpending1(inputs)
	if (locale === "de") return de_issue_totalpending1(inputs)
	if (locale === "ar") return ar_issue_totalpending1(inputs)
	if (locale === "fr") return fr_issue_totalpending1(inputs)
	return ko_issue_totalpending1(inputs)
});
export { issue_totalpending1 as "issue.totalPending" }