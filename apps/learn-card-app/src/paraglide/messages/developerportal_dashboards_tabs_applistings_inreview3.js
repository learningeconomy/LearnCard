/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs */

const en_developerportal_dashboards_tabs_applistings_inreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In Review`)
};

const es_developerportal_dashboards_tabs_applistings_inreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Revisión`)
};

const fr_developerportal_dashboards_tabs_applistings_inreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Révision`)
};

const ar_developerportal_dashboards_tabs_applistings_inreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد المراجعة`)
};

/**
* | output |
* | --- |
* | "In Review" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_inreview3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Inreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_inreview3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_inreview3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_inreview3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_inreview3(inputs)
});
export { developerportal_dashboards_tabs_applistings_inreview3 as "developerPortal.dashboards.tabs.appListings.inReview" }