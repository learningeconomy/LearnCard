/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_createdfromguide6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created from Connect Website Guide`)
};

const es_developerportal_guides_consentflow_apisetupstep_createdfromguide6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created from Connect Website Guide`)
};

const fr_developerportal_guides_consentflow_apisetupstep_createdfromguide6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created from Connect Website Guide`)
};

const ar_developerportal_guides_consentflow_apisetupstep_createdfromguide6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created from Connect Website Guide`)
};

/**
* | output |
* | --- |
* | "Created from Connect Website Guide" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_createdfromguide6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Createdfromguide6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_createdfromguide6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_createdfromguide6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_createdfromguide6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_createdfromguide6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_createdfromguide6 as "developerPortal.guides.consentFlow.apiSetupStep.createdFromGuide" }