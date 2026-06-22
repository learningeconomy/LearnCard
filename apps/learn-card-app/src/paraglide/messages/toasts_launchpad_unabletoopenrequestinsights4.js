/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Launchpad_Unabletoopenrequestinsights4Inputs */

const en_toasts_launchpad_unabletoopenrequestinsights4 = /** @type {(inputs: Toasts_Launchpad_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to open Request Insights`)
};

const es_toasts_launchpad_unabletoopenrequestinsights4 = /** @type {(inputs: Toasts_Launchpad_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo abrir Solicitar Información`)
};

const fr_toasts_launchpad_unabletoopenrequestinsights4 = /** @type {(inputs: Toasts_Launchpad_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'ouvrir Demander des analyses`)
};

const ar_toasts_launchpad_unabletoopenrequestinsights4 = /** @type {(inputs: Toasts_Launchpad_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر فتح طلب الرؤى`)
};

/**
* | output |
* | --- |
* | "Unable to open Request Insights" |
*
* @param {Toasts_Launchpad_Unabletoopenrequestinsights4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_launchpad_unabletoopenrequestinsights4 = /** @type {((inputs?: Toasts_Launchpad_Unabletoopenrequestinsights4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Launchpad_Unabletoopenrequestinsights4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_launchpad_unabletoopenrequestinsights4(inputs)
	if (locale === "es") return es_toasts_launchpad_unabletoopenrequestinsights4(inputs)
	if (locale === "fr") return fr_toasts_launchpad_unabletoopenrequestinsights4(inputs)
	return ar_toasts_launchpad_unabletoopenrequestinsights4(inputs)
});
export { toasts_launchpad_unabletoopenrequestinsights4 as "toasts.launchpad.unableToOpenRequestInsights" }