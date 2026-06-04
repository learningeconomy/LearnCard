/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Noimage1Inputs */

const en_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No image set`)
};

const es_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin imagen`)
};

const de_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kein Bild`)
};

const ar_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد صورة`)
};

const fr_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune image`)
};

const ko_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미지 없음`)
};

/**
* | output |
* | --- |
* | "No image set" |
*
* @param {Boost_Noimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_noimage1 = /** @type {((inputs?: Boost_Noimage1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Noimage1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_noimage1(inputs)
	if (locale === "es") return es_boost_noimage1(inputs)
	if (locale === "de") return de_boost_noimage1(inputs)
	if (locale === "ar") return ar_boost_noimage1(inputs)
	if (locale === "fr") return fr_boost_noimage1(inputs)
	return ko_boost_noimage1(inputs)
});
export { boost_noimage1 as "boost.noImage" }