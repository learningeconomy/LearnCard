/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credentials`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisión de Credenciales`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre des Justificatifs`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار المؤهلات`)
};

/**
* | output |
* | --- |
* | "Issue Credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Name3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_name3 as "developerPortal.dashboards.tabs.appConfig.permissions.items.issueCredentials.name" }