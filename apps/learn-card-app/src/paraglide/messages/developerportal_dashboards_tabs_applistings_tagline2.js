/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs */

const en_developerportal_dashboards_tabs_applistings_tagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tagline`)
};

const es_developerportal_dashboards_tabs_applistings_tagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eslogan`)
};

const fr_developerportal_dashboards_tabs_applistings_tagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Slogan`)
};

const ar_developerportal_dashboards_tabs_applistings_tagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار`)
};

/**
* | output |
* | --- |
* | "Tagline" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_tagline2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Tagline2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_tagline2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_tagline2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_tagline2(inputs)
	return ar_developerportal_dashboards_tabs_applistings_tagline2(inputs)
});
export { developerportal_dashboards_tabs_applistings_tagline2 as "developerPortal.dashboards.tabs.appListings.tagline" }