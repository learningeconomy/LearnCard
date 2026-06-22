/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration ID`)
};

const es_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Integración`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID d'Intégration`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف التكامل`)
};

/**
* | output |
* | --- |
* | "Integration ID" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_settings_integrationid4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Integrationid4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_settings_integrationid4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_settings_integrationid4 as "developerPortal.dashboards.tabs.consentFlowCode.settings.integrationId" }