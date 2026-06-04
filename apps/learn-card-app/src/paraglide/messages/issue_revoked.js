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

const de_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Widerrufen`)
};

const ar_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملغاة`)
};

const fr_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoqués`)
};

const ko_issue_revoked = /** @type {(inputs: Issue_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소됨`)
};

/**
* | output |
* | --- |
* | "Revoked" |
*
* @param {Issue_RevokedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_revoked = /** @type {((inputs?: Issue_RevokedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_RevokedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_revoked(inputs)
	if (locale === "es") return es_issue_revoked(inputs)
	if (locale === "de") return de_issue_revoked(inputs)
	if (locale === "ar") return ar_issue_revoked(inputs)
	if (locale === "fr") return fr_issue_revoked(inputs)
	return ko_issue_revoked(inputs)
});
export { issue_revoked as "issue.revoked" }