/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs */

const en_developerportal_dashboards_tabs_applistings_newapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New App`)
};

const es_developerportal_dashboards_tabs_applistings_newapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva App`)
};

const fr_developerportal_dashboards_tabs_applistings_newapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle App`)
};

const ar_developerportal_dashboards_tabs_applistings_newapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيق جديد`)
};

/**
* | output |
* | --- |
* | "New App" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_newapp3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Newapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_newapp3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_newapp3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_newapp3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_newapp3(inputs)
});
export { developerportal_dashboards_tabs_applistings_newapp3 as "developerPortal.dashboards.tabs.appListings.newApp" }