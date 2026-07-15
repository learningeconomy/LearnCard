/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Noboostsyetempty3Inputs */

const en_boost_noboostsyetempty3 = /** @type {(inputs: Boost_Noboostsyetempty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No boosts yet`)
};

const es_boost_noboostsyetempty3 = /** @type {(inputs: Boost_Noboostsyetempty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay boosts`)
};

const fr_boost_noboostsyetempty3 = /** @type {(inputs: Boost_Noboostsyetempty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore de boosts`)
};

const ar_boost_noboostsyetempty3 = /** @type {(inputs: Boost_Noboostsyetempty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تعزيزات بعد`)
};

/**
* | output |
* | --- |
* | "No boosts yet" |
*
* @param {Boost_Noboostsyetempty3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_noboostsyetempty3 = /** @type {((inputs?: Boost_Noboostsyetempty3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Noboostsyetempty3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_noboostsyetempty3(inputs)
	if (locale === "es") return es_boost_noboostsyetempty3(inputs)
	if (locale === "fr") return fr_boost_noboostsyetempty3(inputs)
	return ar_boost_noboostsyetempty3(inputs)
});
export { boost_noboostsyetempty3 as "boost.noBoostsYetEmpty" }