/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs */

const en_developerportal_dashboards_tabs_applistings_draft2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Draft`)
};

const es_developerportal_dashboards_tabs_applistings_draft2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrador`)
};

const fr_developerportal_dashboards_tabs_applistings_draft2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ar_developerportal_dashboards_tabs_applistings_draft2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_draft2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Draft2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_draft2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_draft2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_draft2(inputs)
	return ar_developerportal_dashboards_tabs_applistings_draft2(inputs)
});
export { developerportal_dashboards_tabs_applistings_draft2 as "developerPortal.dashboards.tabs.appListings.draft" }