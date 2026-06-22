/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_RevokedInputs */

const en_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoked`)
};

const es_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocadas`)
};

const fr_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoqués`)
};

const ar_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملغاة`)
};

/**
* | output |
* | --- |
* | "Revoked" |
*
* @param {Issue_RevokedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_revoked = /** @type {((inputs?: Issue_RevokedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_RevokedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_revoked(inputs)
	if (locale === "es") return es_issue_revoked(inputs)
	if (locale === "fr") return fr_issue_revoked(inputs)
	return ar_issue_revoked(inputs)
});
export { issue_revoked as "issue.revoked" }