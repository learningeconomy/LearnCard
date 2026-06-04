/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Totalrevoked1Inputs */

const en_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total Revoked`)
};

const es_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total revocadas`)
};

const de_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gesamt widerrufen`)
};

const ar_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجمالي الملغاة`)
};

const fr_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total révoqués`)
};

const ko_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`총 취소`)
};

/**
* | output |
* | --- |
* | "Total Revoked" |
*
* @param {Issue_Totalrevoked1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_totalrevoked1 = /** @type {((inputs?: Issue_Totalrevoked1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Totalrevoked1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_totalrevoked1(inputs)
	if (locale === "es") return es_issue_totalrevoked1(inputs)
	if (locale === "de") return de_issue_totalrevoked1(inputs)
	if (locale === "ar") return ar_issue_totalrevoked1(inputs)
	if (locale === "fr") return fr_issue_totalrevoked1(inputs)
	return ko_issue_totalrevoked1(inputs)
});
export { issue_totalrevoked1 as "issue.totalRevoked" }