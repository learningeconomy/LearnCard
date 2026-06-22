/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Boostsavefailed2Inputs */

const en_toasts_boost_boostsavefailed2 = /** @type {(inputs: Toasts_Boost_Boostsavefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to save boost`)
};

const es_toasts_boost_boostsavefailed2 = /** @type {(inputs: Toasts_Boost_Boostsavefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo guardar el boost`)
};

const fr_toasts_boost_boostsavefailed2 = /** @type {(inputs: Toasts_Boost_Boostsavefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'enregistrer le boost`)
};

const ar_toasts_boost_boostsavefailed2 = /** @type {(inputs: Toasts_Boost_Boostsavefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر حفظ Boost`)
};

/**
* | output |
* | --- |
* | "Unable to save boost" |
*
* @param {Toasts_Boost_Boostsavefailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_boostsavefailed2 = /** @type {((inputs?: Toasts_Boost_Boostsavefailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Boostsavefailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_boostsavefailed2(inputs)
	if (locale === "es") return es_toasts_boost_boostsavefailed2(inputs)
	if (locale === "fr") return fr_toasts_boost_boostsavefailed2(inputs)
	return ar_toasts_boost_boostsavefailed2(inputs)
});
export { toasts_boost_boostsavefailed2 as "toasts.boost.boostSaveFailed" }