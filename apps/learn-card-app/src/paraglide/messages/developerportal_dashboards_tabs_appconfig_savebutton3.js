/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs */

const en_developerportal_dashboards_tabs_appconfig_savebutton3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Configuration`)
};

const es_developerportal_dashboards_tabs_appconfig_savebutton3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Configuración`)
};

const fr_developerportal_dashboards_tabs_appconfig_savebutton3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarder la Configuration`)
};

const ar_developerportal_dashboards_tabs_appconfig_savebutton3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ الإعدادات`)
};

/**
* | output |
* | --- |
* | "Save Configuration" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_savebutton3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Savebutton3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_savebutton3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_savebutton3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_savebutton3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_savebutton3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_savebutton3 as "developerPortal.dashboards.tabs.appConfig.saveButton" }