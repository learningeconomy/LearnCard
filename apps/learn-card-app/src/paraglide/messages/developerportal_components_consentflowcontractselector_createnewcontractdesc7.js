/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs */

const en_developerportal_components_consentflowcontractselector_createnewcontractdesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up a new consent flow contract`)
};

const es_developerportal_components_consentflowcontractselector_createnewcontractdesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura un nuevo contrato de flujo de consentimiento`)
};

const fr_developerportal_components_consentflowcontractselector_createnewcontractdesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer un nouveau contrat de flux de consentement`)
};

const ar_developerportal_components_consentflowcontractselector_createnewcontractdesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد عقد تدفق موافقة جديد`)
};

/**
* | output |
* | --- |
* | "Set up a new consent flow contract" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_createnewcontractdesc7 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Createnewcontractdesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_createnewcontractdesc7(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_createnewcontractdesc7(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_createnewcontractdesc7(inputs)
	return ar_developerportal_components_consentflowcontractselector_createnewcontractdesc7(inputs)
});
export { developerportal_components_consentflowcontractselector_createnewcontractdesc7 as "developerPortal.components.consentFlowContractSelector.createNewContractDesc" }