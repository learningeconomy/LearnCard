/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigate to wallet features from your app`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navega a las funciones de la billetera desde tu app`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Naviguer vers les fonctionnalités du portefeuille depuis votre app`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنقل إلى ميزات المحفظة من تطبيقك`)
};

/**
* | output |
* | --- |
* | "Navigate to wallet features from your app" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Navigation_Desc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_items_navigation_desc2 as "developerPortal.dashboards.tabs.appConfig.permissions.items.navigation.desc" }