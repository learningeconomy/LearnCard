/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Uploadimage1Inputs */

const en_boost_uploadimage1 = /** @type {(inputs: Boost_Uploadimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Image`)
};

const es_boost_uploadimage1 = /** @type {(inputs: Boost_Uploadimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir imagen`)
};

const de_boost_uploadimage1 = /** @type {(inputs: Boost_Uploadimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bild hochladen`)
};

const ar_boost_uploadimage1 = /** @type {(inputs: Boost_Uploadimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع صورة`)
};

const fr_boost_uploadimage1 = /** @type {(inputs: Boost_Uploadimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger une image`)
};

const ko_boost_uploadimage1 = /** @type {(inputs: Boost_Uploadimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미지 업로드`)
};

/**
* | output |
* | --- |
* | "Upload Image" |
*
* @param {Boost_Uploadimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_uploadimage1 = /** @type {((inputs?: Boost_Uploadimage1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Uploadimage1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_uploadimage1(inputs)
	if (locale === "es") return es_boost_uploadimage1(inputs)
	if (locale === "de") return de_boost_uploadimage1(inputs)
	if (locale === "ar") return ar_boost_uploadimage1(inputs)
	if (locale === "fr") return fr_boost_uploadimage1(inputs)
	return ko_boost_uploadimage1(inputs)
});
export { boost_uploadimage1 as "boost.uploadImage" }