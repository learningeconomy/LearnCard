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

const de_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abgelaufen`)
};

const ar_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهية الصلاحية`)
};

const fr_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ko_ai_expired = /** @type {(inputs: Ai_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`만료됨`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Ai_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_expired = /** @type {((inputs?: Ai_ExpiredInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_ExpiredInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_expired(inputs)
	if (locale === "es") return es_ai_expired(inputs)
	if (locale === "de") return de_ai_expired(inputs)
	if (locale === "ar") return ar_ai_expired(inputs)
	if (locale === "fr") return fr_ai_expired(inputs)
	return ko_ai_expired(inputs)
});
export { ai_expired as "ai.expired" }