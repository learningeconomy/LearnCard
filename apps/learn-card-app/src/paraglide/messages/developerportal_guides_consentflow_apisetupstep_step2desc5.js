/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialize with your API token:`)
};

const es_developerportal_guides_consentflow_apisetupstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicializa con tu token de API:`)
};

const fr_developerportal_guides_consentflow_apisetupstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialisez avec votre jeton API :`)
};

const ar_developerportal_guides_consentflow_apisetupstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بالتهيئة باستخدام رمز API الخاص بك:`)
};

/**
* | output |
* | --- |
* | "Initialize with your API token:" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_step2desc5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Step2desc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_step2desc5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_step2desc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_step2desc5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_step2desc5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_step2desc5 as "developerPortal.guides.consentFlow.apiSetupStep.step2Desc" }