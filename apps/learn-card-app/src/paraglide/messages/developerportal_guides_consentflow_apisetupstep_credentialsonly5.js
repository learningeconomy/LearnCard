/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_credentialsonly5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Only`)
};

const es_developerportal_guides_consentflow_apisetupstep_credentialsonly5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Only`)
};

const fr_developerportal_guides_consentflow_apisetupstep_credentialsonly5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Only`)
};

const ar_developerportal_guides_consentflow_apisetupstep_credentialsonly5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Only`)
};

/**
* | output |
* | --- |
* | "Credentials Only" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_credentialsonly5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonly5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_credentialsonly5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_credentialsonly5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_credentialsonly5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_credentialsonly5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_credentialsonly5 as "developerPortal.guides.consentFlow.apiSetupStep.credentialsOnly" }