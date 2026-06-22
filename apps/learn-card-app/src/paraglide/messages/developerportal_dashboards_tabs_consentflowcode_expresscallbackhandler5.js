/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Express callback handler`)
};

const es_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manejador de devolución de llamada Express`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de rappel Express`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالج رد الاتصال Express`)
};

/**
* | output |
* | --- |
* | "Express callback handler" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Expresscallbackhandler5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_expresscallbackhandler5 as "developerPortal.dashboards.tabs.consentFlowCode.expressCallbackHandler" }