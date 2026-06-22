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

const fr_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total émis`)
};

const ar_issue_totalissued1 = /** @type {(inputs: Issue_Totalissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجمالي الصادرة`)
};

/**
* | output |
* | --- |
* | "Total Issued" |
*
* @param {Issue_Totalissued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_totalissued1 = /** @type {((inputs?: Issue_Totalissued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Totalissued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_totalissued1(inputs)
	if (locale === "es") return es_issue_totalissued1(inputs)
	if (locale === "fr") return fr_issue_totalissued1(inputs)
	return ar_issue_totalissued1(inputs)
});
export { issue_totalissued1 as "issue.totalIssued" }