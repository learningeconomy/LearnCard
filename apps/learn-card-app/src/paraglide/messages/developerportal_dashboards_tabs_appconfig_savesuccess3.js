/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs */

const en_developerportal_dashboards_tabs_appconfig_savesuccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration saved!`)
};

const es_developerportal_dashboards_tabs_appconfig_savesuccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Configuración guardada!`)
};

const fr_developerportal_dashboards_tabs_appconfig_savesuccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration sauvegardée !`)
};

const ar_developerportal_dashboards_tabs_appconfig_savesuccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ الإعدادات!`)
};

/**
* | output |
* | --- |
* | "Configuration saved!" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_savesuccess3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Savesuccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_savesuccess3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_savesuccess3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_savesuccess3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_savesuccess3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_savesuccess3 as "developerPortal.dashboards.tabs.appConfig.saveSuccess" }