/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs */

const en_developerportal_components_consentflowcontractselector_nocontractsfound6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No contracts found`)
};

const es_developerportal_components_consentflowcontractselector_nocontractsfound6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron contratos`)
};

const fr_developerportal_components_consentflowcontractselector_nocontractsfound6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun contrat trouvé`)
};

const ar_developerportal_components_consentflowcontractselector_nocontractsfound6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على عقود`)
};

/**
* | output |
* | --- |
* | "No contracts found" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_nocontractsfound6 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Nocontractsfound6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_nocontractsfound6(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_nocontractsfound6(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_nocontractsfound6(inputs)
	return ar_developerportal_components_consentflowcontractselector_nocontractsfound6(inputs)
});
export { developerportal_components_consentflowcontractselector_nocontractsfound6 as "developerPortal.components.consentFlowContractSelector.noContractsFound" }