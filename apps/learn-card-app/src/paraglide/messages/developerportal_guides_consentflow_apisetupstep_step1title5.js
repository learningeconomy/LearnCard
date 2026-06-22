/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_step1title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install LearnCard SDK`)
};

const es_developerportal_guides_consentflow_apisetupstep_step1title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instalar SDK de LearnCard`)
};

const fr_developerportal_guides_consentflow_apisetupstep_step1title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installer le SDK LearnCard`)
};

const ar_developerportal_guides_consentflow_apisetupstep_step1title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تثبيت LearnCard SDK`)
};

/**
* | output |
* | --- |
* | "Install LearnCard SDK" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_step1title5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Step1title5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_step1title5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_step1title5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_step1title5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_step1title5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_step1title5 as "developerPortal.guides.consentFlow.apiSetupStep.step1Title" }