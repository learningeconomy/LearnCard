/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Modal_Unabletoopenrequestinsights4Inputs */

const en_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to open Request Insights`)
};

const es_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo abrir Solicitar Información`)
};

const fr_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'ouvrir Demander des analyses`)
};

const ar_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر فتح طلب الرؤى`)
};

/**
* | output |
* | --- |
* | "Unable to open Request Insights" |
*
* @param {Launchpad_Modal_Unabletoopenrequestinsights4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_unabletoopenrequestinsights4 = /** @type {((inputs?: Launchpad_Modal_Unabletoopenrequestinsights4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Unabletoopenrequestinsights4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_unabletoopenrequestinsights4(inputs)
	if (locale === "es") return es_launchpad_modal_unabletoopenrequestinsights4(inputs)
	if (locale === "fr") return fr_launchpad_modal_unabletoopenrequestinsights4(inputs)
	return ar_launchpad_modal_unabletoopenrequestinsights4(inputs)
});
export { launchpad_modal_unabletoopenrequestinsights4 as "launchpad.modal.unableToOpenRequestInsights" }