/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send credentials to the user's wallet`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía credenciales a la billetera del usuario`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer des justificatifs au portefeuille de l'utilisateur`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال المؤهلات إلى محفظة المستخدم`)
};

/**
* | output |
* | --- |
* | "Send credentials to the user's wallet" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Issuecredentials_Desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_items_issuecredentials_desc3 as "developerPortal.dashboards.tabs.appConfig.permissions.items.issueCredentials.desc" }