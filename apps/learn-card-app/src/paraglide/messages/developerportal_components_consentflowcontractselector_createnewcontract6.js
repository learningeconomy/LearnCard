/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs */

const en_developerportal_components_consentflowcontractselector_createnewcontract6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Contract`)
};

const es_developerportal_components_consentflowcontractselector_createnewcontract6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nuevo Contrato`)
};

const fr_developerportal_components_consentflowcontractselector_createnewcontract6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Nouveau Contrat`)
};

const ar_developerportal_components_consentflowcontractselector_createnewcontract6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء عقد جديد`)
};

/**
* | output |
* | --- |
* | "Create New Contract" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_createnewcontract6 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Createnewcontract6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_createnewcontract6(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_createnewcontract6(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_createnewcontract6(inputs)
	return ar_developerportal_components_consentflowcontractselector_createnewcontract6(inputs)
});
export { developerportal_components_consentflowcontractselector_createnewcontract6 as "developerPortal.components.consentFlowContractSelector.createNewContract" }