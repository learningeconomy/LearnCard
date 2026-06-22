/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_flowstep35 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard redirects back to your app with their DID`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_flowstep35 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard redirige de vuelta a tu aplicación con su DID`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep35 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard redirige vers votre application avec son DID`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep35 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يعيد LearnCard التوجيه إلى تطبيقك مع DID الخاص به`)
};

/**
* | output |
* | --- |
* | "LearnCard redirects back to your app with their DID" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_flowstep35 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_flowstep35(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_flowstep35(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep35(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep35(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_flowstep35 as "developerPortal.guides.consentFlow.redirectHandlerStep.flowStep3" }