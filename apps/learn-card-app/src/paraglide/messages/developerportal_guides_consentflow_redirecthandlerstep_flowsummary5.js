/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flow Summary`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen del Flujo`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé du Flux`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخص التدفق`)
};

/**
* | output |
* | --- |
* | "Flow Summary" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_flowsummary5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowsummary5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_flowsummary5(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_flowsummary5 as "developerPortal.guides.consentFlow.redirectHandlerStep.flowSummary" }