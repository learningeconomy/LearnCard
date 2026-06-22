/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-app.com/api/learncard/callback`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://tu-app.com/api/learncard/callback`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-app.com/api/learncard/callback`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-app.com/api/learncard/callback`)
};

/**
* | output |
* | --- |
* | "https://your-app.com/api/learncard/callback" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlplaceholder6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_callbackurlplaceholder6 as "developerPortal.guides.consentFlow.redirectHandlerStep.callbackUrlPlaceholder" }