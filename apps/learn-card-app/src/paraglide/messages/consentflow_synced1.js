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

const de_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisiert`)
};

const ar_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت المزامنة`)
};

const fr_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisé`)
};

const ko_consentflow_synced1 = /** @type {(inputs: Consentflow_Synced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`동기화됨`)
};

/**
* | output |
* | --- |
* | "Synced" |
*
* @param {Consentflow_Synced1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_synced1 = /** @type {((inputs?: Consentflow_Synced1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Synced1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_synced1(inputs)
	if (locale === "es") return es_consentflow_synced1(inputs)
	if (locale === "de") return de_consentflow_synced1(inputs)
	if (locale === "ar") return ar_consentflow_synced1(inputs)
	if (locale === "fr") return fr_consentflow_synced1(inputs)
	return ko_consentflow_synced1(inputs)
});
export { consentflow_synced1 as "consentFlow.synced" }