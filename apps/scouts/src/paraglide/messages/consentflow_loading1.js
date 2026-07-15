/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Loading1Inputs */

const en_consentflow_loading1 = /** @type {(inputs: Consentflow_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_consentflow_loading1 = /** @type {(inputs: Consentflow_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_consentflow_loading1 = /** @type {(inputs: Consentflow_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement en cours...`)
};

const ar_consentflow_loading1 = /** @type {(inputs: Consentflow_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Consentflow_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_loading1 = /** @type {((inputs?: Consentflow_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_loading1(inputs)
	if (locale === "es") return es_consentflow_loading1(inputs)
	if (locale === "fr") return fr_consentflow_loading1(inputs)
	return ar_consentflow_loading1(inputs)
});
export { consentflow_loading1 as "consentFlow.loading" }