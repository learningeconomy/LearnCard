/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs */

const en_developerportal_components_consentflowcontractselector_contracturi5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract URI`)
};

const es_developerportal_components_consentflowcontractselector_contracturi5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI del Contrato`)
};

const fr_developerportal_components_consentflowcontractselector_contracturi5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI du Contrat`)
};

const ar_developerportal_components_consentflowcontractselector_contracturi5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI العقد`)
};

/**
* | output |
* | --- |
* | "Contract URI" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_contracturi5 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Contracturi5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_contracturi5(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_contracturi5(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_contracturi5(inputs)
	return ar_developerportal_components_consentflowcontractselector_contracturi5(inputs)
});
export { developerportal_components_consentflowcontractselector_contracturi5 as "developerPortal.components.consentFlowContractSelector.contractUri" }