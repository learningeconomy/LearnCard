/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_RevokingInputs */

const en_issue_revoking = /** @type {(inputs: Issue_RevokingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoking...`)
};

const es_issue_revoking = /** @type {(inputs: Issue_RevokingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocando...`)
};

const fr_issue_revoking = /** @type {(inputs: Issue_RevokingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révocation...`)
};

const ar_issue_revoking = /** @type {(inputs: Issue_RevokingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإلغاء...`)
};

/**
* | output |
* | --- |
* | "Revoking..." |
*
* @param {Issue_RevokingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_revoking = /** @type {((inputs?: Issue_RevokingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_RevokingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_revoking(inputs)
	if (locale === "es") return es_issue_revoking(inputs)
	if (locale === "fr") return fr_issue_revoking(inputs)
	return ar_issue_revoking(inputs)
});
export { issue_revoking as "issue.revoking" }