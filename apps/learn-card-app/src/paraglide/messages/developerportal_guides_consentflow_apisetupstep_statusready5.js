/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Token: ${i?.name}`)
};

const es_developerportal_guides_consentflow_apisetupstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Token: ${i?.name}`)
};

const fr_developerportal_guides_consentflow_apisetupstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Token: ${i?.name}`)
};

const ar_developerportal_guides_consentflow_apisetupstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Token: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Token: {name}" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_statusready5 = /** @type {((inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Statusready5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_statusready5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_statusready5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_statusready5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_statusready5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_statusready5 as "developerPortal.guides.consentFlow.apiSetupStep.statusReady" }