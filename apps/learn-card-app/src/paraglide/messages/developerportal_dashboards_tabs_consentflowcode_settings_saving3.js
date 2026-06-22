/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_settings_saving3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_developerportal_dashboards_tabs_consentflowcode_settings_saving3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_settings_saving3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarde...`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_settings_saving3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الحفظ...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_settings_saving3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Saving3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_settings_saving3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_settings_saving3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_settings_saving3(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_settings_saving3(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_settings_saving3 as "developerPortal.dashboards.tabs.consentFlowCode.settings.saving" }