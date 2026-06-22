/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Syncing1Inputs */

const en_consentflow_syncing1 = /** @type {(inputs: Consentflow_Syncing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Syncing...`)
};

const es_consentflow_syncing1 = /** @type {(inputs: Consentflow_Syncing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizando...`)
};

const fr_consentflow_syncing1 = /** @type {(inputs: Consentflow_Syncing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisation...`)
};

const ar_consentflow_syncing1 = /** @type {(inputs: Consentflow_Syncing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...مزامنة`)
};

/**
* | output |
* | --- |
* | "Syncing..." |
*
* @param {Consentflow_Syncing1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_syncing1 = /** @type {((inputs?: Consentflow_Syncing1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Syncing1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_syncing1(inputs)
	if (locale === "es") return es_consentflow_syncing1(inputs)
	if (locale === "fr") return fr_consentflow_syncing1(inputs)
	return ar_consentflow_syncing1(inputs)
});
export { consentflow_syncing1 as "consentFlow.syncing" }