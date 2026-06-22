/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Callback URL`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu URL de Devolución`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre URL de Rappel`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان URL الاستدعاء الخاص بك`)
};

/**
* | output |
* | --- |
* | "Your Callback URL" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurllabel6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_callbackurllabel6 as "developerPortal.guides.consentFlow.redirectHandlerStep.callbackUrlLabel" }