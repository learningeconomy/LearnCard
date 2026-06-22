/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs */

const en_developerportal_components_consentflowcontractselector_nocontractsfounddesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one above to get started`)
};

const es_developerportal_components_consentflowcontractselector_nocontractsfounddesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea uno arriba para empezar`)
};

const fr_developerportal_components_consentflowcontractselector_nocontractsfounddesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez-en un ci-dessus pour commencer`)
};

const ar_developerportal_components_consentflowcontractselector_nocontractsfounddesc7 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واحداً أعلاه للبدء`)
};

/**
* | output |
* | --- |
* | "Create one above to get started" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_nocontractsfounddesc7 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Nocontractsfounddesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_nocontractsfounddesc7(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_nocontractsfounddesc7(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_nocontractsfounddesc7(inputs)
	return ar_developerportal_components_consentflowcontractselector_nocontractsfounddesc7(inputs)
});
export { developerportal_components_consentflowcontractselector_nocontractsfounddesc7 as "developerPortal.components.consentFlowContractSelector.noContractsFoundDesc" }