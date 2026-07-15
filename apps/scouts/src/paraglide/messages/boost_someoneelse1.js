/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Someoneelse1Inputs */

const en_boost_someoneelse1 = /** @type {(inputs: Boost_Someoneelse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Someone Else`)
};

const es_boost_someoneelse1 = /** @type {(inputs: Boost_Someoneelse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otra Persona`)
};

const fr_boost_someoneelse1 = /** @type {(inputs: Boost_Someoneelse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quelqu'un d'autre`)
};

const ar_boost_someoneelse1 = /** @type {(inputs: Boost_Someoneelse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شخص آخر`)
};

/**
* | output |
* | --- |
* | "Someone Else" |
*
* @param {Boost_Someoneelse1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_someoneelse1 = /** @type {((inputs?: Boost_Someoneelse1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Someoneelse1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_someoneelse1(inputs)
	if (locale === "es") return es_boost_someoneelse1(inputs)
	if (locale === "fr") return fr_boost_someoneelse1(inputs)
	return ar_boost_someoneelse1(inputs)
});
export { boost_someoneelse1 as "boost.someoneElse" }