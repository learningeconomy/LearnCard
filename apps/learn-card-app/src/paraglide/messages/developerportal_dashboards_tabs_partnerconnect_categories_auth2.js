/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_categories_auth2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Authentication`)
};

const es_developerportal_dashboards_tabs_partnerconnect_categories_auth2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autenticación`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_categories_auth2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Authentification`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_categories_auth2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المصادقة`)
};

/**
* | output |
* | --- |
* | "Authentication" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_categories_auth2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Categories_Auth2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_categories_auth2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_categories_auth2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_categories_auth2(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_categories_auth2(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_categories_auth2 as "developerPortal.dashboards.tabs.partnerConnect.categories.auth" }