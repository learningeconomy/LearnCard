/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Anonymize1Inputs */

const en_consentflow_anonymize1 = /** @type {(inputs: Consentflow_Anonymize1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymize Data`)
};

const es_consentflow_anonymize1 = /** @type {(inputs: Consentflow_Anonymize1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonimizar Datos`)
};

const fr_consentflow_anonymize1 = /** @type {(inputs: Consentflow_Anonymize1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymiser les données`)
};

const ar_consentflow_anonymize1 = /** @type {(inputs: Consentflow_Anonymize1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إخفاء الهوية`)
};

/**
* | output |
* | --- |
* | "Anonymize Data" |
*
* @param {Consentflow_Anonymize1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_anonymize1 = /** @type {((inputs?: Consentflow_Anonymize1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Anonymize1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_anonymize1(inputs)
	if (locale === "es") return es_consentflow_anonymize1(inputs)
	if (locale === "fr") return fr_consentflow_anonymize1(inputs)
	return ar_consentflow_anonymize1(inputs)
});
export { consentflow_anonymize1 as "consentFlow.anonymize" }