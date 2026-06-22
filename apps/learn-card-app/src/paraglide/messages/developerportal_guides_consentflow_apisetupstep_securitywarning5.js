/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_securitywarning5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expose your API token in client-side code or commit it to version control.`)
};

const es_developerportal_guides_consentflow_apisetupstep_securitywarning5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nunca expongas tu token de API en código del lado del cliente ni lo guardes en control de versiones.`)
};

const fr_developerportal_guides_consentflow_apisetupstep_securitywarning5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`N'exposez jamais votre jeton API dans le code côté client et ne le commitez pas dans le contrôle de version.`)
};

const ar_developerportal_guides_consentflow_apisetupstep_securitywarning5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تعرض رمز API أبداً في كود جانب العميل ولا تقم بإضافته إلى التحكم في الإصدارات.`)
};

/**
* | output |
* | --- |
* | "Never expose your API token in client-side code or commit it to version control." |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_securitywarning5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Securitywarning5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_securitywarning5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_securitywarning5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_securitywarning5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_securitywarning5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_securitywarning5 as "developerPortal.guides.consentFlow.apiSetupStep.securityWarning" }