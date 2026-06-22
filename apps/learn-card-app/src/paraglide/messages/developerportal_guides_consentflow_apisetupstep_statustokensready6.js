/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, context: NonNullable<unknown> }} Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_statustokensready6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} tokens ready`);
	return /** @type {LocalizedString} */ (`${i?.count} token ready`)
	
};

const es_developerportal_guides_consentflow_apisetupstep_statustokensready6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} tokens listos`);
	return /** @type {LocalizedString} */ (`${i?.count} token listo`)
	
};

const fr_developerportal_guides_consentflow_apisetupstep_statustokensready6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} jetons prêts`);
	return /** @type {LocalizedString} */ (`${i?.count} jeton prêt`)
	
};

const ar_developerportal_guides_consentflow_apisetupstep_statustokensready6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} رموز جاهزة`);
	return /** @type {LocalizedString} */ (`${i?.count} رمز جاهز`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "{count} tokens ready" |
* | * | "{count} token ready" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_statustokensready6 = /** @type {((inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Statustokensready6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_statustokensready6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_statustokensready6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_statustokensready6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_statustokensready6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_statustokensready6 as "developerPortal.guides.consentFlow.apiSetupStep.statusTokensReady" }