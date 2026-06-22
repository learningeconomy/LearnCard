/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select what your app can access from the wallet`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona lo que tu app puede acceder desde la billetera`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez ce que votre app peut accéder depuis le portefeuille`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر ما يمكن لتطبيقك الوصول إليه من المحفظة`)
};

/**
* | output |
* | --- |
* | "Select what your app can access from the wallet" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_desc2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Desc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_desc2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_desc2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_desc2(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_desc2(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_desc2 as "developerPortal.dashboards.tabs.appConfig.permissions.desc" }