/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs */

const en_developerportal_dashboards_tabs_applistings_iconalt3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icon`)
};

const es_developerportal_dashboards_tabs_applistings_iconalt3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icono`)
};

const fr_developerportal_dashboards_tabs_applistings_iconalt3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icône`)
};

const ar_developerportal_dashboards_tabs_applistings_iconalt3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أيقونة`)
};

/**
* | output |
* | --- |
* | "Icon" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_iconalt3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Iconalt3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_iconalt3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_iconalt3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_iconalt3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_iconalt3(inputs)
});
export { developerportal_dashboards_tabs_applistings_iconalt3 as "developerPortal.dashboards.tabs.appListings.iconAlt" }