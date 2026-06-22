/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs */

const en_developerportal_dashboards_tabs_appconfig_saveerror3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save configuration`)
};

const es_developerportal_dashboards_tabs_appconfig_saveerror3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al guardar la configuración`)
};

const fr_developerportal_dashboards_tabs_appconfig_saveerror3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la sauvegarde de la configuration`)
};

const ar_developerportal_dashboards_tabs_appconfig_saveerror3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حفظ الإعدادات`)
};

/**
* | output |
* | --- |
* | "Failed to save configuration" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_saveerror3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Saveerror3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_saveerror3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_saveerror3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_saveerror3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_saveerror3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_saveerror3 as "developerPortal.dashboards.tabs.appConfig.saveError" }