/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Toasts_Consentflow_Connected1Inputs */

const en_toasts_consentflow_connected1 = /** @type {(inputs: Toasts_Consentflow_Connected1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Successfully connected to ${i?.name}`)
};

const es_toasts_consentflow_connected1 = /** @type {(inputs: Toasts_Consentflow_Connected1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Conectado exitosamente a ${i?.name}`)
};

const fr_toasts_consentflow_connected1 = /** @type {(inputs: Toasts_Consentflow_Connected1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Connecté avec succès à ${i?.name}`)
};

const ar_toasts_consentflow_connected1 = /** @type {(inputs: Toasts_Consentflow_Connected1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم الاتصال بنجاح بـ ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Successfully connected to {name}" |
*
* @param {Toasts_Consentflow_Connected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_consentflow_connected1 = /** @type {((inputs: Toasts_Consentflow_Connected1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Consentflow_Connected1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_consentflow_connected1(inputs)
	if (locale === "es") return es_toasts_consentflow_connected1(inputs)
	if (locale === "fr") return fr_toasts_consentflow_connected1(inputs)
	return ar_toasts_consentflow_connected1(inputs)
});
export { toasts_consentflow_connected1 as "toasts.consentFlow.connected" }