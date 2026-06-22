/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs */

const en_developerportal_components_consentflowcontractselector_selectorcreate6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or create a contract...`)
};

const es_developerportal_components_consentflowcontractselector_selectorcreate6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona o crea un contrato...`)
};

const fr_developerportal_components_consentflowcontractselector_selectorcreate6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez ou créez un contrat...`)
};

const ar_developerportal_components_consentflowcontractselector_selectorcreate6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر أو أنشئ عقداً...`)
};

/**
* | output |
* | --- |
* | "Select or create a contract..." |
*
* @param {Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_selectorcreate6 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Selectorcreate6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_selectorcreate6(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_selectorcreate6(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_selectorcreate6(inputs)
	return ar_developerportal_components_consentflowcontractselector_selectorcreate6(inputs)
});
export { developerportal_components_consentflowcontractselector_selectorcreate6 as "developerPortal.components.consentFlowContractSelector.selectOrCreate" }