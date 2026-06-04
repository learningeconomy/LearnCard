/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_EarnedInputs */

const en_boost_earned = /** @type {(inputs: Boost_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Earned`)
};

const es_boost_earned = /** @type {(inputs: Boost_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenido`)
};

const de_boost_earned = /** @type {(inputs: Boost_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erhalten`)
};

const ar_boost_earned = /** @type {(inputs: Boost_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مكتسبة`)
};

const fr_boost_earned = /** @type {(inputs: Boost_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenu`)
};

const ko_boost_earned = /** @type {(inputs: Boost_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취득`)
};

/**
* | output |
* | --- |
* | "Earned" |
*
* @param {Boost_EarnedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_earned = /** @type {((inputs?: Boost_EarnedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_EarnedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_earned(inputs)
	if (locale === "es") return es_boost_earned(inputs)
	if (locale === "de") return de_boost_earned(inputs)
	if (locale === "ar") return ar_boost_earned(inputs)
	if (locale === "fr") return fr_boost_earned(inputs)
	return ko_boost_earned(inputs)
});
export { boost_earned as "boost.earned" }