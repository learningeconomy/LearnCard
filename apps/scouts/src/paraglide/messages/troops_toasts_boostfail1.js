/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Boostfail1Inputs */

const en_troops_toasts_boostfail1 = /** @type {(inputs: Troops_Toasts_Boostfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to process boost`)
};

const es_troops_toasts_boostfail1 = /** @type {(inputs: Troops_Toasts_Boostfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al procesar boost`)
};

const fr_troops_toasts_boostfail1 = /** @type {(inputs: Troops_Toasts_Boostfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du traitement du Boost`)
};

const ar_troops_toasts_boostfail1 = /** @type {(inputs: Troops_Toasts_Boostfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل معالجة التعزيز`)
};

/**
* | output |
* | --- |
* | "Failed to process boost" |
*
* @param {Troops_Toasts_Boostfail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_boostfail1 = /** @type {((inputs?: Troops_Toasts_Boostfail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Boostfail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_boostfail1(inputs)
	if (locale === "es") return es_troops_toasts_boostfail1(inputs)
	if (locale === "fr") return fr_troops_toasts_boostfail1(inputs)
	return ar_troops_toasts_boostfail1(inputs)
});
export { troops_toasts_boostfail1 as "troops.toasts.boostFail" }