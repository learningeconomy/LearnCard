/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Logintorequest3Inputs */

const en_aiinsights_logintorequest3 = /** @type {(inputs: Aiinsights_Logintorequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login to Request`)
};

const es_aiinsights_logintorequest3 = /** @type {(inputs: Aiinsights_Logintorequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para solicitar`)
};

const fr_aiinsights_logintorequest3 = /** @type {(inputs: Aiinsights_Logintorequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous pour demander`)
};

const ar_aiinsights_logintorequest3 = /** @type {(inputs: Aiinsights_Logintorequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجّل الدخول للطلب`)
};

/**
* | output |
* | --- |
* | "Login to Request" |
*
* @param {Aiinsights_Logintorequest3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_logintorequest3 = /** @type {((inputs?: Aiinsights_Logintorequest3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Logintorequest3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_logintorequest3(inputs)
	if (locale === "es") return es_aiinsights_logintorequest3(inputs)
	if (locale === "fr") return fr_aiinsights_logintorequest3(inputs)
	return ar_aiinsights_logintorequest3(inputs)
});
export { aiinsights_logintorequest3 as "aiInsights.loginToRequest" }