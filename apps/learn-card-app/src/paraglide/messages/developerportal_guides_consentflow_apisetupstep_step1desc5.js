/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install the LearnCard SDK in your backend application:`)
};

const es_developerportal_guides_consentflow_apisetupstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala el SDK de LearnCard en tu aplicación backend:`)
};

const fr_developerportal_guides_consentflow_apisetupstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installez le SDK LearnCard dans votre application backend :`)
};

const ar_developerportal_guides_consentflow_apisetupstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتثبيت LearnCard SDK في تطبيق الخادم الخلفي الخاص بك:`)
};

/**
* | output |
* | --- |
* | "Install the LearnCard SDK in your backend application:" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_step1desc5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Step1desc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_step1desc5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_step1desc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_step1desc5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_step1desc5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_step1desc5 as "developerPortal.guides.consentFlow.apiSetupStep.step1Desc" }