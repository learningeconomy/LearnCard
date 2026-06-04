/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Boostissuederror2Inputs */

const en_toasts_boost_boostissuederror2 = /** @type {(inputs: Toasts_Boost_Boostissuederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error issuing boost`)
};

const es_toasts_boost_boostissuederror2 = /** @type {(inputs: Toasts_Boost_Boostissuederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al emitir boost`)
};

const de_toasts_boost_boostissuederror2 = /** @type {(inputs: Toasts_Boost_Boostissuederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fehler beim Ausstellen des Boosts`)
};

const ar_toasts_boost_boostissuederror2 = /** @type {(inputs: Toasts_Boost_Boostissuederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في إصدار Boost`)
};

const fr_toasts_boost_boostissuederror2 = /** @type {(inputs: Toasts_Boost_Boostissuederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de l'émission du boost`)
};

const ko_toasts_boost_boostissuederror2 = /** @type {(inputs: Toasts_Boost_Boostissuederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트 발급 오류`)
};

/**
* | output |
* | --- |
* | "Error issuing boost" |
*
* @param {Toasts_Boost_Boostissuederror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_boostissuederror2 = /** @type {((inputs?: Toasts_Boost_Boostissuederror2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Boostissuederror2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_boostissuederror2(inputs)
	if (locale === "es") return es_toasts_boost_boostissuederror2(inputs)
	if (locale === "de") return de_toasts_boost_boostissuederror2(inputs)
	if (locale === "ar") return ar_toasts_boost_boostissuederror2(inputs)
	if (locale === "fr") return fr_toasts_boost_boostissuederror2(inputs)
	return ko_toasts_boost_boostissuederror2(inputs)
});
export { toasts_boost_boostissuederror2 as "toasts.boost.boostIssuedError" }