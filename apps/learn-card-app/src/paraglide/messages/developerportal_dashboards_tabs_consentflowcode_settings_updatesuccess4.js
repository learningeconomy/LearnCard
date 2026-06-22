/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Callback URL updated`)
};

const es_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de devolución de llamada actualizada`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de rappel mise à jour`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث رابط الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Callback URL updated" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updatesuccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_settings_updatesuccess4 as "developerPortal.dashboards.tabs.consentFlowCode.settings.updateSuccess" }