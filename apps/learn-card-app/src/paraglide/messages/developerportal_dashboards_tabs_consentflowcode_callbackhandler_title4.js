/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Callback Handler`)
};

const es_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manejador de Devolución de Llamada`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de Rappel`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالج الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Callback Handler" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_callbackhandler_title4 as "developerPortal.dashboards.tabs.consentFlowCode.callbackHandler.title" }