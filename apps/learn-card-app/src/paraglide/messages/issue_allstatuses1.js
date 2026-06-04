/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Allstatuses1Inputs */

const en_issue_allstatuses1 = /** @type {(inputs: Issue_Allstatuses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_issue_allstatuses1 = /** @type {(inputs: Issue_Allstatuses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas`)
};

const de_issue_allstatuses1 = /** @type {(inputs: Issue_Allstatuses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle`)
};

const ar_issue_allstatuses1 = /** @type {(inputs: Issue_Allstatuses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

const fr_issue_allstatuses1 = /** @type {(inputs: Issue_Allstatuses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous`)
};

const ko_issue_allstatuses1 = /** @type {(inputs: Issue_Allstatuses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전체`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Issue_Allstatuses1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_allstatuses1 = /** @type {((inputs?: Issue_Allstatuses1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Allstatuses1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_allstatuses1(inputs)
	if (locale === "es") return es_issue_allstatuses1(inputs)
	if (locale === "de") return de_issue_allstatuses1(inputs)
	if (locale === "ar") return ar_issue_allstatuses1(inputs)
	if (locale === "fr") return fr_issue_allstatuses1(inputs)
	return ko_issue_allstatuses1(inputs)
});
export { issue_allstatuses1 as "issue.allStatuses" }