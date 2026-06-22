/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs */

const en_developerportal_components_consentflowcontractselector_yourcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Contracts`)
};

const es_developerportal_components_consentflowcontractselector_yourcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus Contratos`)
};

const fr_developerportal_components_consentflowcontractselector_yourcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos Contrats`)
};

const ar_developerportal_components_consentflowcontractselector_yourcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقودك`)
};

/**
* | output |
* | --- |
* | "Your Contracts" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_yourcontracts5 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Yourcontracts5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_yourcontracts5(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_yourcontracts5(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_yourcontracts5(inputs)
	return ar_developerportal_components_consentflowcontractselector_yourcontracts5(inputs)
});
export { developerportal_components_consentflowcontractselector_yourcontracts5 as "developerPortal.components.consentFlowContractSelector.yourContracts" }