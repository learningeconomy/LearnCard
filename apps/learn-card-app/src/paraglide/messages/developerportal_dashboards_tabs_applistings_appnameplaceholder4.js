/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs */

const en_developerportal_dashboards_tabs_applistings_appnameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Awesome App`)
};

const es_developerportal_dashboards_tabs_applistings_appnameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi App Increíble`)
};

const fr_developerportal_dashboards_tabs_applistings_appnameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon App Géniale`)
};

const ar_developerportal_dashboards_tabs_applistings_appnameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقي الرائع`)
};

/**
* | output |
* | --- |
* | "My Awesome App" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_appnameplaceholder4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Appnameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_appnameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_appnameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_appnameplaceholder4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_appnameplaceholder4(inputs)
});
export { developerportal_dashboards_tabs_applistings_appnameplaceholder4 as "developerPortal.dashboards.tabs.appListings.appNamePlaceholder" }