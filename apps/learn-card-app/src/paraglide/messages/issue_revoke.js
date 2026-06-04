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

const de_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Widerrufen`)
};

const ar_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

const fr_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoquer`)
};

const ko_issue_revoke = /** @type {(inputs: Issue_RevokeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소`)
};

/**
* | output |
* | --- |
* | "Revoke" |
*
* @param {Issue_RevokeInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_revoke = /** @type {((inputs?: Issue_RevokeInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_RevokeInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_revoke(inputs)
	if (locale === "es") return es_issue_revoke(inputs)
	if (locale === "de") return de_issue_revoke(inputs)
	if (locale === "ar") return ar_issue_revoke(inputs)
	if (locale === "fr") return fr_issue_revoke(inputs)
	return ko_issue_revoke(inputs)
});
export { issue_revoke as "issue.revoke" }