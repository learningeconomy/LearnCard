/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Callback URL (returnTo)`)
};

const es_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Devolución de Llamada (returnTo)`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Rappel (returnTo)`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الاستدعاء (returnTo)`)
};

/**
* | output |
* | --- |
* | "Callback URL (returnTo)" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Callbackurl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_settings_callbackurl4 as "developerPortal.dashboards.tabs.consentFlowCode.settings.callbackUrl" }