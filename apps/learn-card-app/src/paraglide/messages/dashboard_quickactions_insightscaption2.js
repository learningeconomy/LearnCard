/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Insightscaption2Inputs */

const en_dashboard_quickactions_insightscaption2 = /** @type {(inputs: Dashboard_Quickactions_Insightscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI summary of your record`)
};

const es_dashboard_quickactions_insightscaption2 = /** @type {(inputs: Dashboard_Quickactions_Insightscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen de IA de tu historial`)
};

const fr_dashboard_quickactions_insightscaption2 = /** @type {(inputs: Dashboard_Quickactions_Insightscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé IA de votre historique`)
};

const ar_dashboard_quickactions_insightscaption2 = /** @type {(inputs: Dashboard_Quickactions_Insightscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخص بالذكاء الاصطناعي لسجلك`)
};

/**
* | output |
* | --- |
* | "AI summary of your record" |
*
* @param {Dashboard_Quickactions_Insightscaption2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_insightscaption2 = /** @type {((inputs?: Dashboard_Quickactions_Insightscaption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Insightscaption2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_insightscaption2(inputs)
	if (locale === "es") return es_dashboard_quickactions_insightscaption2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_insightscaption2(inputs)
	return ar_dashboard_quickactions_insightscaption2(inputs)
});
export { dashboard_quickactions_insightscaption2 as "dashboard.quickActions.insightsCaption" }