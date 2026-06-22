/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_ImageInputs */

const en_boost_image = /** @type {(inputs: Boost_ImageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image`)
};

const es_boost_image = /** @type {(inputs: Boost_ImageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen`)
};

const fr_boost_image = /** @type {(inputs: Boost_ImageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image`)
};

const ar_boost_image = /** @type {(inputs: Boost_ImageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصورة`)
};

/**
* | output |
* | --- |
* | "Image" |
*
* @param {Boost_ImageInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_image = /** @type {((inputs?: Boost_ImageInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_ImageInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_image(inputs)
	if (locale === "es") return es_boost_image(inputs)
	if (locale === "fr") return fr_boost_image(inputs)
	return ar_boost_image(inputs)
});
export { boost_image as "boost.image" }