/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request ongoing data access via consent contracts`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicita acceso continuo a datos mediante contratos de consentimiento`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander un accès continu aux données via des contrats de consentement`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الوصول المستمر إلى البيانات عبر عقود الموافقة`)
};

/**
* | output |
* | --- |
* | "Request ongoing data access via consent contracts" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Items_Consent_Desc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_items_consent_desc2 as "developerPortal.dashboards.tabs.appConfig.permissions.items.consent.desc" }