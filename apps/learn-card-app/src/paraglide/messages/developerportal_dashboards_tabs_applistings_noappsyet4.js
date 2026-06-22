/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs */

const en_developerportal_dashboards_tabs_applistings_noappsyet4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No apps yet`)
};

const es_developerportal_dashboards_tabs_applistings_noappsyet4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay apps`)
};

const fr_developerportal_dashboards_tabs_applistings_noappsyet4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore d'applications`)
};

const ar_developerportal_dashboards_tabs_applistings_noappsyet4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تطبيقات بعد`)
};

/**
* | output |
* | --- |
* | "No apps yet" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_noappsyet4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Noappsyet4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_noappsyet4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_noappsyet4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_noappsyet4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_noappsyet4(inputs)
});
export { developerportal_dashboards_tabs_applistings_noappsyet4 as "developerPortal.dashboards.tabs.appListings.noAppsYet" }