/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Applaunch_Error1Inputs */

const en_dashboard_applaunch_error1 = /** @type {(inputs: Dashboard_Applaunch_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couldn't open this app. Please try again.`)
};

const es_dashboard_applaunch_error1 = /** @type {(inputs: Dashboard_Applaunch_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo abrir esta app. Inténtalo de nuevo.`)
};

const fr_dashboard_applaunch_error1 = /** @type {(inputs: Dashboard_Applaunch_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'ouvrir cette app. Veuillez réessayer.`)
};

const ar_dashboard_applaunch_error1 = /** @type {(inputs: Dashboard_Applaunch_Error1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر فتح هذا التطبيق. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Couldn't open this app. Please try again." |
*
* @param {Dashboard_Applaunch_Error1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_applaunch_error1 = /** @type {((inputs?: Dashboard_Applaunch_Error1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Applaunch_Error1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_applaunch_error1(inputs)
	if (locale === "es") return es_dashboard_applaunch_error1(inputs)
	if (locale === "fr") return fr_dashboard_applaunch_error1(inputs)
	return ar_dashboard_applaunch_error1(inputs)
});
export { dashboard_applaunch_error1 as "dashboard.appLaunch.error" }