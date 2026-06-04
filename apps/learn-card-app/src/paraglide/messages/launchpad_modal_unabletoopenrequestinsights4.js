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

const de_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einblicke anfordern konnte nicht geöffnet werden`)
};

const ar_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر فتح طلب الرؤى`)
};

const fr_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'ouvrir Demander des analyses`)
};

const ko_launchpad_modal_unabletoopenrequestinsights4 = /** @type {(inputs: Launchpad_Modal_Unabletoopenrequestinsights4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`인사이트 요청을 열 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to open Request Insights" |
*
* @param {Launchpad_Modal_Unabletoopenrequestinsights4Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_unabletoopenrequestinsights4 = /** @type {((inputs?: Launchpad_Modal_Unabletoopenrequestinsights4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Unabletoopenrequestinsights4Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_unabletoopenrequestinsights4(inputs)
	if (locale === "es") return es_launchpad_modal_unabletoopenrequestinsights4(inputs)
	if (locale === "de") return de_launchpad_modal_unabletoopenrequestinsights4(inputs)
	if (locale === "ar") return ar_launchpad_modal_unabletoopenrequestinsights4(inputs)
	if (locale === "fr") return fr_launchpad_modal_unabletoopenrequestinsights4(inputs)
	return ko_launchpad_modal_unabletoopenrequestinsights4(inputs)
});
export { launchpad_modal_unabletoopenrequestinsights4 as "launchpad.modal.unableToOpenRequestInsights" }