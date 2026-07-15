/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Alreadyconsented2Inputs */

const en_consentflow_alreadyconsented2 = /** @type {(inputs: Consentflow_Alreadyconsented2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Already Consented`)
};

const es_consentflow_alreadyconsented2 = /** @type {(inputs: Consentflow_Alreadyconsented2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya Consentido`)
};

const fr_consentflow_alreadyconsented2 = /** @type {(inputs: Consentflow_Alreadyconsented2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déjà consenti`)
};

const ar_consentflow_alreadyconsented2 = /** @type {(inputs: Consentflow_Alreadyconsented2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة مسبقاً`)
};

/**
* | output |
* | --- |
* | "Already Consented" |
*
* @param {Consentflow_Alreadyconsented2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_alreadyconsented2 = /** @type {((inputs?: Consentflow_Alreadyconsented2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Alreadyconsented2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_alreadyconsented2(inputs)
	if (locale === "es") return es_consentflow_alreadyconsented2(inputs)
	if (locale === "fr") return fr_consentflow_alreadyconsented2(inputs)
	return ar_consentflow_alreadyconsented2(inputs)
});
export { consentflow_alreadyconsented2 as "consentFlow.alreadyConsented" }