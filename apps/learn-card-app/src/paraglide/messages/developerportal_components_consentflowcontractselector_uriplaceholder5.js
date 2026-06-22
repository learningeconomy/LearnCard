/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs */

const en_developerportal_components_consentflowcontractselector_uriplaceholder5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`lc:network:contract:...`)
};

const es_developerportal_components_consentflowcontractselector_uriplaceholder5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`lc:network:contract:...`)
};

const fr_developerportal_components_consentflowcontractselector_uriplaceholder5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`lc:network:contract:...`)
};

const ar_developerportal_components_consentflowcontractselector_uriplaceholder5 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`lc:network:contract:...`)
};

/**
* | output |
* | --- |
* | "lc:network:contract:..." |
*
* @param {Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_uriplaceholder5 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Uriplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_uriplaceholder5(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_uriplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_uriplaceholder5(inputs)
	return ar_developerportal_components_consentflowcontractselector_uriplaceholder5(inputs)
});
export { developerportal_components_consentflowcontractselector_uriplaceholder5 as "developerPortal.components.consentFlowContractSelector.uriPlaceholder" }