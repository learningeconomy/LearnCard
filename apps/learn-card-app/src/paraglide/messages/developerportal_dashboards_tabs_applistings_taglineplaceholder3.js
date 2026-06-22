/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs */

const en_developerportal_dashboards_tabs_applistings_taglineplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A short description...`)
};

const es_developerportal_dashboards_tabs_applistings_taglineplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una breve descripción...`)
};

const fr_developerportal_dashboards_tabs_applistings_taglineplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une brève description...`)
};

const ar_developerportal_dashboards_tabs_applistings_taglineplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف مختصر...`)
};

/**
* | output |
* | --- |
* | "A short description..." |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_taglineplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Taglineplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_taglineplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_taglineplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_taglineplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_taglineplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_applistings_taglineplaceholder3 as "developerPortal.dashboards.tabs.appListings.taglinePlaceholder" }