/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Acceptandsync3Inputs */

const en_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept & Sync`)
};

const es_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar y sincronizar`)
};

const de_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annehmen & synchronisieren`)
};

const ar_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول ومزامنة`)
};

const fr_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter et synchroniser`)
};

const ko_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수락 및 동기화`)
};

/**
* | output |
* | --- |
* | "Accept & Sync" |
*
* @param {Consentflow_Acceptandsync3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_acceptandsync3 = /** @type {((inputs?: Consentflow_Acceptandsync3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Acceptandsync3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_acceptandsync3(inputs)
	if (locale === "es") return es_consentflow_acceptandsync3(inputs)
	if (locale === "de") return de_consentflow_acceptandsync3(inputs)
	if (locale === "ar") return ar_consentflow_acceptandsync3(inputs)
	if (locale === "fr") return fr_consentflow_acceptandsync3(inputs)
	return ko_consentflow_acceptandsync3(inputs)
});
export { consentflow_acceptandsync3 as "consentFlow.acceptAndSync" }