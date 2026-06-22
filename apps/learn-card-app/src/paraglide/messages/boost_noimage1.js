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

const fr_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune image`)
};

const ar_boost_noimage1 = /** @type {(inputs: Boost_Noimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد صورة`)
};

/**
* | output |
* | --- |
* | "No image set" |
*
* @param {Boost_Noimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_noimage1 = /** @type {((inputs?: Boost_Noimage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Noimage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_noimage1(inputs)
	if (locale === "es") return es_boost_noimage1(inputs)
	if (locale === "fr") return fr_boost_noimage1(inputs)
	return ar_boost_noimage1(inputs)
});
export { boost_noimage1 as "boost.noImage" }