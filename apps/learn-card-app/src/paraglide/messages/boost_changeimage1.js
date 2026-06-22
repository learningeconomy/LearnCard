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

const fr_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer l'image`)
};

const ar_boost_changeimage1 = /** @type {(inputs: Boost_Changeimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير الصورة`)
};

/**
* | output |
* | --- |
* | "Change Image" |
*
* @param {Boost_Changeimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_changeimage1 = /** @type {((inputs?: Boost_Changeimage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Changeimage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_changeimage1(inputs)
	if (locale === "es") return es_boost_changeimage1(inputs)
	if (locale === "fr") return fr_boost_changeimage1(inputs)
	return ar_boost_changeimage1(inputs)
});
export { boost_changeimage1 as "boost.changeImage" }