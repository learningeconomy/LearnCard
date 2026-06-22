/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Consentflow_Nocontracts3Inputs */

const en_admintools_consentflow_nocontracts3 = /** @type {(inputs: Admintools_Consentflow_Nocontracts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No existing contracts.`)
};

const es_admintools_consentflow_nocontracts3 = /** @type {(inputs: Admintools_Consentflow_Nocontracts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay contratos existentes.`)
};

const fr_admintools_consentflow_nocontracts3 = /** @type {(inputs: Admintools_Consentflow_Nocontracts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun contrat existant.`)
};

const ar_admintools_consentflow_nocontracts3 = /** @type {(inputs: Admintools_Consentflow_Nocontracts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد عقود حالية.`)
};

/**
* | output |
* | --- |
* | "No existing contracts." |
*
* @param {Admintools_Consentflow_Nocontracts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_consentflow_nocontracts3 = /** @type {((inputs?: Admintools_Consentflow_Nocontracts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Consentflow_Nocontracts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_consentflow_nocontracts3(inputs)
	if (locale === "es") return es_admintools_consentflow_nocontracts3(inputs)
	if (locale === "fr") return fr_admintools_consentflow_nocontracts3(inputs)
	return ar_admintools_consentflow_nocontracts3(inputs)
});
export { admintools_consentflow_nocontracts3 as "adminTools.consentFlow.noContracts" }