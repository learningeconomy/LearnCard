/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_ExpiredInputs */

const en_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired`)
};

const es_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expirada`)
};

const fr_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ar_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهية الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Ai_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_expired = /** @type {((inputs?: Ai_ExpiredInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_ExpiredInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_expired(inputs)
	if (locale === "es") return es_ai_expired(inputs)
	if (locale === "fr") return fr_ai_expired(inputs)
	return ar_ai_expired(inputs)
});
export { ai_expired as "ai.expired" }