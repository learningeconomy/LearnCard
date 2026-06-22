/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Unabletoload3Inputs */

const en_aiinsights_unabletoload3 = /** @type {(inputs: Aiinsights_Unabletoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to load notification`)
};

const es_aiinsights_unabletoload3 = /** @type {(inputs: Aiinsights_Unabletoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo cargar la notificación`)
};

const fr_aiinsights_unabletoload3 = /** @type {(inputs: Aiinsights_Unabletoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de charger la notification`)
};

const ar_aiinsights_unabletoload3 = /** @type {(inputs: Aiinsights_Unabletoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحميل الإشعار`)
};

/**
* | output |
* | --- |
* | "Unable to load notification" |
*
* @param {Aiinsights_Unabletoload3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_unabletoload3 = /** @type {((inputs?: Aiinsights_Unabletoload3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Unabletoload3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_unabletoload3(inputs)
	if (locale === "es") return es_aiinsights_unabletoload3(inputs)
	if (locale === "fr") return fr_aiinsights_unabletoload3(inputs)
	return ar_aiinsights_unabletoload3(inputs)
});
export { aiinsights_unabletoload3 as "aiInsights.unableToLoad" }