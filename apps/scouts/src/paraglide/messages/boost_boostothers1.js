/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Boostothers1Inputs */

const en_boost_boostothers1 = /** @type {(inputs: Boost_Boostothers1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Others`)
};

const es_boost_boostothers1 = /** @type {(inputs: Boost_Boostothers1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost a Otros`)
};

const fr_boost_boostothers1 = /** @type {(inputs: Boost_Boostothers1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Booster d'autres`)
};

const ar_boost_boostothers1 = /** @type {(inputs: Boost_Boostothers1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز الآخرين`)
};

/**
* | output |
* | --- |
* | "Boost Others" |
*
* @param {Boost_Boostothers1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_boostothers1 = /** @type {((inputs?: Boost_Boostothers1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Boostothers1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_boostothers1(inputs)
	if (locale === "es") return es_boost_boostothers1(inputs)
	if (locale === "fr") return fr_boost_boostothers1(inputs)
	return ar_boost_boostothers1(inputs)
});
export { boost_boostothers1 as "boost.boostOthers" }