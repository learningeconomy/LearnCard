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

const de_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost-Details`)
};

const ar_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل الترقية`)
};

const fr_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails du Boost`)
};

const ko_boost_boostdetails1 = /** @type {(inputs: Boost_Boostdetails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트 상세`)
};

/**
* | output |
* | --- |
* | "Boost Details" |
*
* @param {Boost_Boostdetails1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_boostdetails1 = /** @type {((inputs?: Boost_Boostdetails1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Boostdetails1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_boostdetails1(inputs)
	if (locale === "es") return es_boost_boostdetails1(inputs)
	if (locale === "de") return de_boost_boostdetails1(inputs)
	if (locale === "ar") return ar_boost_boostdetails1(inputs)
	if (locale === "fr") return fr_boost_boostdetails1(inputs)
	return ko_boost_boostdetails1(inputs)
});
export { boost_boostdetails1 as "boost.boostDetails" }