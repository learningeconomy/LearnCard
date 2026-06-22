/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_ClaimInputs */

const en_common_claim = /** @type {(inputs: Common_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim`)
};

const es_common_claim = /** @type {(inputs: Common_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamar`)
};

const fr_common_claim = /** @type {(inputs: Common_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamer`)
};

const ar_common_claim = /** @type {(inputs: Common_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطالبة`)
};

/**
* | output |
* | --- |
* | "Claim" |
*
* @param {Common_ClaimInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_claim = /** @type {((inputs?: Common_ClaimInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ClaimInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_claim(inputs)
	if (locale === "es") return es_common_claim(inputs)
	if (locale === "fr") return fr_common_claim(inputs)
	return ar_common_claim(inputs)
});
export { common_claim as "common.claim" }