/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_required2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Required`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_required2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requerido`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_required2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requis`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_required2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب`)
};

/**
* | output |
* | --- |
* | "Required" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_required2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Required2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_required2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_required2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_required2(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_required2(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_required2 as "developerPortal.dashboards.tabs.appConfig.permissions.required" }