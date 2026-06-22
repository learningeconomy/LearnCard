/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Boostdetails1Inputs */

const en_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Details`)
};

const es_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles del Boost`)
};

const fr_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails du Boost`)
};

const ar_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل الترقية`)
};

/**
* | output |
* | --- |
* | "Boost Details" |
*
* @param {Boost_Boostdetails1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_boostdetails1 = /** @type {((inputs?: Boost_Boostdetails1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Boostdetails1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_boostdetails1(inputs)
	if (locale === "es") return es_boost_boostdetails1(inputs)
	if (locale === "fr") return fr_boost_boostdetails1(inputs)
	return ar_boost_boostdetails1(inputs)
});
export { boost_boostdetails1 as "boost.boostDetails" }