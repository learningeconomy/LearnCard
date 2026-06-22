/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_fullaccess5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Access`)
};

const es_developerportal_guides_consentflow_apisetupstep_fullaccess5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Access`)
};

const fr_developerportal_guides_consentflow_apisetupstep_fullaccess5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Access`)
};

const ar_developerportal_guides_consentflow_apisetupstep_fullaccess5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Access`)
};

/**
* | output |
* | --- |
* | "Full Access" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_fullaccess5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Fullaccess5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_fullaccess5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_fullaccess5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_fullaccess5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_fullaccess5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_fullaccess5 as "developerPortal.guides.consentFlow.apiSetupStep.fullAccess" }