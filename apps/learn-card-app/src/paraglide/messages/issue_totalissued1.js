/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Totalissued1Inputs */

const en_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total Issued`)
};

const es_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total emitidas`)
};

const de_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gesamt ausgestellt`)
};

const ar_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجمالي الصادرة`)
};

const fr_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total émis`)
};

const ko_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`총 발급`)
};

/**
* | output |
* | --- |
* | "Total Issued" |
*
* @param {Issue_Totalissued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_totalissued1 = /** @type {((inputs?: Issue_Totalissued1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Totalissued1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_totalissued1(inputs)
	if (locale === "es") return es_issue_totalissued1(inputs)
	if (locale === "de") return de_issue_totalissued1(inputs)
	if (locale === "ar") return ar_issue_totalissued1(inputs)
	if (locale === "fr") return fr_issue_totalissued1(inputs)
	return ko_issue_totalissued1(inputs)
});
export { issue_totalissued1 as "issue.totalIssued" }