/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Synced1Inputs */

const en_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synced`)
};

const es_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizado`)
};

const fr_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisé`)
};

const ar_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت المزامنة`)
};

/**
* | output |
* | --- |
* | "Synced" |
*
* @param {Consentflow_Synced1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_synced1 = /** @type {((inputs?: Consentflow_Synced1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Synced1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_synced1(inputs)
	if (locale === "es") return es_consentflow_synced1(inputs)
	if (locale === "fr") return fr_consentflow_synced1(inputs)
	return ar_consentflow_synced1(inputs)
});
export { consentflow_synced1 as "consentFlow.synced" }