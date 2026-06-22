/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Consentflow_Contracts2Inputs */

const en_admintools_consentflow_contracts2 = /** @type {(inputs: Admintools_Consentflow_Contracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contracts`)
};

const es_admintools_consentflow_contracts2 = /** @type {(inputs: Admintools_Consentflow_Contracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contratos`)
};

const fr_admintools_consentflow_contracts2 = /** @type {(inputs: Admintools_Consentflow_Contracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrats`)
};

const ar_admintools_consentflow_contracts2 = /** @type {(inputs: Admintools_Consentflow_Contracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العقود`)
};

/**
* | output |
* | --- |
* | "Contracts" |
*
* @param {Admintools_Consentflow_Contracts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_consentflow_contracts2 = /** @type {((inputs?: Admintools_Consentflow_Contracts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Consentflow_Contracts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_consentflow_contracts2(inputs)
	if (locale === "es") return es_admintools_consentflow_contracts2(inputs)
	if (locale === "fr") return fr_admintools_consentflow_contracts2(inputs)
	return ar_admintools_consentflow_contracts2(inputs)
});
export { admintools_consentflow_contracts2 as "adminTools.consentFlow.contracts" }