/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Noboostsyet2Inputs */

const en_boost_noboostsyet2 = /** @type {(inputs: Boost_Noboostsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Boosts yet!`)
};

const es_boost_noboostsyet2 = /** @type {(inputs: Boost_Noboostsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Aún no hay Boosts!`)
};

const fr_boost_noboostsyet2 = /** @type {(inputs: Boost_Noboostsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore de Boosts !`)
};

const ar_boost_noboostsyet2 = /** @type {(inputs: Boost_Noboostsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Boosts yet!`)
};

/**
* | output |
* | --- |
* | "No Boosts yet!" |
*
* @param {Boost_Noboostsyet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_noboostsyet2 = /** @type {((inputs?: Boost_Noboostsyet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Noboostsyet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_noboostsyet2(inputs)
	if (locale === "es") return es_boost_noboostsyet2(inputs)
	if (locale === "fr") return fr_boost_noboostsyet2(inputs)
	return ar_boost_noboostsyet2(inputs)
});
export { boost_noboostsyet2 as "boost.noBoostsYet" }