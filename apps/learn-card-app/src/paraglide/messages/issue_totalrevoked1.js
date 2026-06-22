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

const fr_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total révoqués`)
};

const ar_issue_totalrevoked1 = /** @type {(inputs: Issue_Totalrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجمالي الملغاة`)
};

/**
* | output |
* | --- |
* | "Total Revoked" |
*
* @param {Issue_Totalrevoked1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_totalrevoked1 = /** @type {((inputs?: Issue_Totalrevoked1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Totalrevoked1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_totalrevoked1(inputs)
	if (locale === "es") return es_issue_totalrevoked1(inputs)
	if (locale === "fr") return fr_issue_totalrevoked1(inputs)
	return ar_issue_totalrevoked1(inputs)
});
export { issue_totalrevoked1 as "issue.totalRevoked" }