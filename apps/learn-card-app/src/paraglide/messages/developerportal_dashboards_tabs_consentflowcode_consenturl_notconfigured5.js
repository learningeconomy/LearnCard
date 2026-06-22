/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not configured: Complete the Build guide to set your contract URI and callback URL.`)
};

const es_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No configurado: Completa la guía de Build para establecer tu URI de contrato y URL de devolución de llamada.`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non configuré : Complétez le guide Build pour définir votre URI de contrat et votre URL de rappel.`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مهيأ: أكمل دليل البناء لتعيين رابط العقد ورابط الاستدعاء الخاص بك.`)
};

/**
* | output |
* | --- |
* | "Not configured: Complete the Build guide to set your contract URI and callback URL." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Notconfigured5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_consenturl_notconfigured5 as "developerPortal.dashboards.tabs.consentFlowCode.consentUrl.notConfigured" }