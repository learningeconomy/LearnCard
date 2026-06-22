/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue and manage credentials`)
};

const es_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue and manage credentials`)
};

const fr_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue and manage credentials`)
};

const ar_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue and manage credentials`)
};

/**
* | output |
* | --- |
* | "Issue and manage credentials" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Credentialsonlydesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_credentialsonlydesc6 as "developerPortal.guides.consentFlow.apiSetupStep.credentialsOnlyDesc" }