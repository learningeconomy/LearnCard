/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Fromscratch1Inputs */

const en_boost_fromscratch1 = /** @type {(inputs: Boost_Fromscratch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start from scratch`)
};

const es_boost_fromscratch1 = /** @type {(inputs: Boost_Fromscratch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear desde cero`)
};

const fr_boost_fromscratch1 = /** @type {(inputs: Boost_Fromscratch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer de zéro`)
};

const ar_boost_fromscratch1 = /** @type {(inputs: Boost_Fromscratch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء من الصفر`)
};

/**
* | output |
* | --- |
* | "Start from scratch" |
*
* @param {Boost_Fromscratch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_fromscratch1 = /** @type {((inputs?: Boost_Fromscratch1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Fromscratch1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_fromscratch1(inputs)
	if (locale === "es") return es_boost_fromscratch1(inputs)
	if (locale === "fr") return fr_boost_fromscratch1(inputs)
	return ar_boost_fromscratch1(inputs)
});
export { boost_fromscratch1 as "boost.fromScratch" }