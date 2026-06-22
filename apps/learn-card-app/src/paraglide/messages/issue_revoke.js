/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_RevokeInputs */

const en_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoke`)
};

const es_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocar`)
};

const fr_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoquer`)
};

const ar_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

/**
* | output |
* | --- |
* | "Revoke" |
*
* @param {Issue_RevokeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_revoke = /** @type {((inputs?: Issue_RevokeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_RevokeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_revoke(inputs)
	if (locale === "es") return es_issue_revoke(inputs)
	if (locale === "fr") return fr_issue_revoke(inputs)
	return ar_issue_revoke(inputs)
});
export { issue_revoke as "issue.revoke" }