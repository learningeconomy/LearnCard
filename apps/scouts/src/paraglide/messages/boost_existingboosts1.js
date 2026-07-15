/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Existingboosts1Inputs */

const en_boost_existingboosts1 = /** @type {(inputs: Boost_Existingboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Existing boosts`)
};

const es_boost_existingboosts1 = /** @type {(inputs: Boost_Existingboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts existentes`)
};

const fr_boost_existingboosts1 = /** @type {(inputs: Boost_Existingboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts existants`)
};

const ar_boost_existingboosts1 = /** @type {(inputs: Boost_Existingboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التعزيزات الموجودة`)
};

/**
* | output |
* | --- |
* | "Existing boosts" |
*
* @param {Boost_Existingboosts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_existingboosts1 = /** @type {((inputs?: Boost_Existingboosts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Existingboosts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_existingboosts1(inputs)
	if (locale === "es") return es_boost_existingboosts1(inputs)
	if (locale === "fr") return fr_boost_existingboosts1(inputs)
	return ar_boost_existingboosts1(inputs)
});
export { boost_existingboosts1 as "boost.existingBoosts" }