/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs */

const en_developerportal_dashboards_tabs_connections_sharedcategories2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Shared Credential Categories`)
};

const es_developerportal_dashboards_tabs_connections_sharedcategories2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categorías de Credenciales Compartidas`)
};

const fr_developerportal_dashboards_tabs_connections_sharedcategories2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégories de Justificatifs Partagées`)
};

const ar_developerportal_dashboards_tabs_connections_sharedcategories2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فئات المؤهلات المشتركة`)
};

/**
* | output |
* | --- |
* | "Shared Credential Categories" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_sharedcategories2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Sharedcategories2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_sharedcategories2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_sharedcategories2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_sharedcategories2(inputs)
	return ar_developerportal_dashboards_tabs_connections_sharedcategories2(inputs)
});
export { developerportal_dashboards_tabs_connections_sharedcategories2 as "developerPortal.dashboards.tabs.connections.sharedCategories" }