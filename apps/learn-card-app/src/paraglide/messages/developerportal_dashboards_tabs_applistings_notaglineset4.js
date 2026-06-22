/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs */

const en_developerportal_dashboards_tabs_applistings_notaglineset4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tagline set`)
};

const es_developerportal_dashboards_tabs_applistings_notaglineset4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin eslogan`)
};

const fr_developerportal_dashboards_tabs_applistings_notaglineset4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas de slogan`)
};

const ar_developerportal_dashboards_tabs_applistings_notaglineset4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تعيين شعار`)
};

/**
* | output |
* | --- |
* | "No tagline set" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_notaglineset4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Notaglineset4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_notaglineset4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_notaglineset4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_notaglineset4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_notaglineset4(inputs)
});
export { developerportal_dashboards_tabs_applistings_notaglineset4 as "developerPortal.dashboards.tabs.appListings.noTaglineSet" }