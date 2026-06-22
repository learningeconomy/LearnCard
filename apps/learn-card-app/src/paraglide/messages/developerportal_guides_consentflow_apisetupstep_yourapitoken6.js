/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_yourapitoken6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your API Token`)
};

const es_developerportal_guides_consentflow_apisetupstep_yourapitoken6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Token de API`)
};

const fr_developerportal_guides_consentflow_apisetupstep_yourapitoken6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Jeton API`)
};

const ar_developerportal_guides_consentflow_apisetupstep_yourapitoken6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز API الخاص بك`)
};

/**
* | output |
* | --- |
* | "Your API Token" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_yourapitoken6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Yourapitoken6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_yourapitoken6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_yourapitoken6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_yourapitoken6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_yourapitoken6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_yourapitoken6 as "developerPortal.guides.consentFlow.apiSetupStep.yourApiToken" }