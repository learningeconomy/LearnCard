/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claimboost_Unabletofind3Inputs */

const en_claimboost_unabletofind3 = /** @type {(inputs: Claimboost_Unabletofind3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to find boost`)
};

const es_claimboost_unabletofind3 = /** @type {(inputs: Claimboost_Unabletofind3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo encontrar el boost`)
};

const fr_claimboost_unabletofind3 = /** @type {(inputs: Claimboost_Unabletofind3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de trouver le Boost`)
};

const ar_claimboost_unabletofind3 = /** @type {(inputs: Claimboost_Unabletofind3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر العثور على التعزيز`)
};

/**
* | output |
* | --- |
* | "Unable to find boost" |
*
* @param {Claimboost_Unabletofind3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claimboost_unabletofind3 = /** @type {((inputs?: Claimboost_Unabletofind3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claimboost_Unabletofind3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claimboost_unabletofind3(inputs)
	if (locale === "es") return es_claimboost_unabletofind3(inputs)
	if (locale === "fr") return fr_claimboost_unabletofind3(inputs)
	return ar_claimboost_unabletofind3(inputs)
});
export { claimboost_unabletofind3 as "claimBoost.unableToFind" }