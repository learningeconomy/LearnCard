/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Disconnecting1Inputs */

const en_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnecting...`)
};

const es_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconectando...`)
};

const fr_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion en cours...`)
};

const ar_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري قطع الاتصال...`)
};

/**
* | output |
* | --- |
* | "Disconnecting..." |
*
* @param {Consentflow_Disconnecting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_disconnecting1 = /** @type {((inputs?: Consentflow_Disconnecting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Disconnecting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_disconnecting1(inputs)
	if (locale === "es") return es_consentflow_disconnecting1(inputs)
	if (locale === "fr") return fr_consentflow_disconnecting1(inputs)
	return ar_consentflow_disconnecting1(inputs)
});
export { consentflow_disconnecting1 as "consentFlow.disconnecting" }