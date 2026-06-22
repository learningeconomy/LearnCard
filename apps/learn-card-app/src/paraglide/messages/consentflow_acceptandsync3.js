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

const fr_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter et synchroniser`)
};

const ar_consentflow_acceptandsync3 = /** @type {(inputs: Consentflow_Acceptandsync3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول ومزامنة`)
};

/**
* | output |
* | --- |
* | "Accept & Sync" |
*
* @param {Consentflow_Acceptandsync3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_acceptandsync3 = /** @type {((inputs?: Consentflow_Acceptandsync3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Acceptandsync3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_acceptandsync3(inputs)
	if (locale === "es") return es_consentflow_acceptandsync3(inputs)
	if (locale === "fr") return fr_consentflow_acceptandsync3(inputs)
	return ar_consentflow_acceptandsync3(inputs)
});
export { consentflow_acceptandsync3 as "consentFlow.acceptAndSync" }