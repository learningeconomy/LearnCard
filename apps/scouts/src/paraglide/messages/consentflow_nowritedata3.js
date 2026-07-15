/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Nowritedata3Inputs */

const en_consentflow_nowritedata3 = /** @type {(inputs: Consentflow_Nowritedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This contract is not writing any data to your LearnCard`)
};

const es_consentflow_nowritedata3 = /** @type {(inputs: Consentflow_Nowritedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este contrato no está escribiendo datos en tu LearnCard`)
};

const fr_consentflow_nowritedata3 = /** @type {(inputs: Consentflow_Nowritedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce contrat n'écrit aucune donnée dans votre LearnCard`)
};

const ar_consentflow_nowritedata3 = /** @type {(inputs: Consentflow_Nowritedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This contract is not writing any data to your LearnCard`)
};

/**
* | output |
* | --- |
* | "This contract is not writing any data to your LearnCard" |
*
* @param {Consentflow_Nowritedata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_nowritedata3 = /** @type {((inputs?: Consentflow_Nowritedata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Nowritedata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_nowritedata3(inputs)
	if (locale === "es") return es_consentflow_nowritedata3(inputs)
	if (locale === "fr") return fr_consentflow_nowritedata3(inputs)
	return ar_consentflow_nowritedata3(inputs)
});
export { consentflow_nowritedata3 as "consentFlow.noWriteData" }