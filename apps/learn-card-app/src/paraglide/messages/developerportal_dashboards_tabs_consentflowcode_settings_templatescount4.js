/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} saved`)
};

const es_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} guardada(s)`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} sauvegardé(s)`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} تم الحفظ`)
};

/**
* | output |
* | --- |
* | "{count} saved" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_settings_templatescount4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Settings_Templatescount4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_settings_templatescount4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_settings_templatescount4 as "developerPortal.dashboards.tabs.consentFlowCode.settings.templatesCount" }