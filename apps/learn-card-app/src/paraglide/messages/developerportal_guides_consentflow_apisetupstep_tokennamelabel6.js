/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_tokennamelabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token Name`)
};

const es_developerportal_guides_consentflow_apisetupstep_tokennamelabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Token`)
};

const fr_developerportal_guides_consentflow_apisetupstep_tokennamelabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Jeton`)
};

const ar_developerportal_guides_consentflow_apisetupstep_tokennamelabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الرمز`)
};

/**
* | output |
* | --- |
* | "Token Name" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_tokennamelabel6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Tokennamelabel6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_tokennamelabel6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_tokennamelabel6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_tokennamelabel6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_tokennamelabel6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_tokennamelabel6 as "developerPortal.guides.consentFlow.apiSetupStep.tokenNameLabel" }