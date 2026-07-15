/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_RevokedInputs */

const en_common_revoked = /** @type {(inputs: Common_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoked`)
};

const es_common_revoked = /** @type {(inputs: Common_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocado`)
};

const fr_common_revoked = /** @type {(inputs: Common_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoqué`)
};

const ar_common_revoked = /** @type {(inputs: Common_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملغى`)
};

/**
* | output |
* | --- |
* | "Revoked" |
*
* @param {Common_RevokedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_revoked = /** @type {((inputs?: Common_RevokedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_RevokedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_revoked(inputs)
	if (locale === "es") return es_common_revoked(inputs)
	if (locale === "fr") return fr_common_revoked(inputs)
	return ar_common_revoked(inputs)
});
export { common_revoked as "common.revoked" }