/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Changeimage1Inputs */

const en_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change Image`)
};

const es_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar imagen`)
};

const de_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bild ändern`)
};

const ar_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير الصورة`)
};

const fr_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer l'image`)
};

const ko_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미지 변경`)
};

/**
* | output |
* | --- |
* | "Change Image" |
*
* @param {Boost_Changeimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_changeimage1 = /** @type {((inputs?: Boost_Changeimage1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Changeimage1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_changeimage1(inputs)
	if (locale === "es") return es_boost_changeimage1(inputs)
	if (locale === "de") return de_boost_changeimage1(inputs)
	if (locale === "ar") return ar_boost_changeimage1(inputs)
	if (locale === "fr") return fr_boost_changeimage1(inputs)
	return ko_boost_changeimage1(inputs)
});
export { boost_changeimage1 as "boost.changeImage" }