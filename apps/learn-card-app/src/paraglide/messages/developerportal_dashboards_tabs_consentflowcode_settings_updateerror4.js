/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to update callback URL`)
};

const es_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar la URL de devolución de llamada`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour de l'URL de rappel`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحديث رابط الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Failed to update callback URL" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_settings_updateerror4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Updateerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_settings_updateerror4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_settings_updateerror4 as "developerPortal.dashboards.tabs.consentFlowCode.settings.updateError" }