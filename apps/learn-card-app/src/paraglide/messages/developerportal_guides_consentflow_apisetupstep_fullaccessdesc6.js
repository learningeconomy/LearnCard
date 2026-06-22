/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete access to all resources`)
};

const es_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete access to all resources`)
};

const fr_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete access to all resources`)
};

const ar_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete access to all resources`)
};

/**
* | output |
* | --- |
* | "Complete access to all resources" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_fullaccessdesc6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Fullaccessdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_fullaccessdesc6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_fullaccessdesc6 as "developerPortal.guides.consentFlow.apiSetupStep.fullAccessDesc" }