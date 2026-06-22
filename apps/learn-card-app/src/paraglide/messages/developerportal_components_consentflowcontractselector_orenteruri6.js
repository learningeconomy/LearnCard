/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs */

const en_developerportal_components_consentflowcontractselector_orenteruri6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or enter URI manually`)
};

const es_developerportal_components_consentflowcontractselector_orenteruri6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O introduce URI manualmente`)
};

const fr_developerportal_components_consentflowcontractselector_orenteruri6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ou saisir l'URI manuellement`)
};

const ar_developerportal_components_consentflowcontractselector_orenteruri6 = /** @type {(inputs: Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو أدخل URI يدوياً`)
};

/**
* | output |
* | --- |
* | "Or enter URI manually" |
*
* @param {Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_consentflowcontractselector_orenteruri6 = /** @type {((inputs?: Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Consentflowcontractselector_Orenteruri6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_consentflowcontractselector_orenteruri6(inputs)
	if (locale === "es") return es_developerportal_components_consentflowcontractselector_orenteruri6(inputs)
	if (locale === "fr") return fr_developerportal_components_consentflowcontractselector_orenteruri6(inputs)
	return ar_developerportal_components_consentflowcontractselector_orenteruri6(inputs)
});
export { developerportal_components_consentflowcontractselector_orenteruri6 as "developerPortal.components.consentFlowContractSelector.orEnterUri" }