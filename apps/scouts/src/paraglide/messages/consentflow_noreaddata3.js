/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Noreaddata3Inputs */

const en_consentflow_noreaddata3 = /** @type {(inputs: Consentflow_Noreaddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This contract is not reading any data from your LearnCard`)
};

const es_consentflow_noreaddata3 = /** @type {(inputs: Consentflow_Noreaddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este contrato no está leyendo datos de tu LearnCard`)
};

const fr_consentflow_noreaddata3 = /** @type {(inputs: Consentflow_Noreaddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce contrat ne lit aucune donnée de votre LearnCard`)
};

const ar_consentflow_noreaddata3 = /** @type {(inputs: Consentflow_Noreaddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This contract is not reading any data from your LearnCard`)
};

/**
* | output |
* | --- |
* | "This contract is not reading any data from your LearnCard" |
*
* @param {Consentflow_Noreaddata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_noreaddata3 = /** @type {((inputs?: Consentflow_Noreaddata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Noreaddata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_noreaddata3(inputs)
	if (locale === "es") return es_consentflow_noreaddata3(inputs)
	if (locale === "fr") return fr_consentflow_noreaddata3(inputs)
	return ar_consentflow_noreaddata3(inputs)
});
export { consentflow_noreaddata3 as "consentFlow.noReadData" }