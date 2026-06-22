/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs */

const en_developerportal_components_consentflowcontractselector_loadingcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading contracts...`)
};

const es_developerportal_components_consentflowcontractselector_loadingcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando contratos...`)
};

const fr_developerportal_components_consentflowcontractselector_loadingcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des contrats...`)
};

const ar_developerportal_components_consentflowcontractselector_loadingcontracts5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل العقود...`)
};

/**
* | output |
* | --- |
* | "Loading contracts..." |
*
* @param {Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_loadingcontracts5 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Loadingcontracts5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_loadingcontracts5(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_loadingcontracts5(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_loadingcontracts5(inputs)
	return ar_developerportal_components_consentflowcontractselector_loadingcontracts5(inputs)
});
export { developerportal_components_consentflowcontractselector_loadingcontracts5 as "developerPortal.components.consentFlowContractSelector.loadingContracts" }