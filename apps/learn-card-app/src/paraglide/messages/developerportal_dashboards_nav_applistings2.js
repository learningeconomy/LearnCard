/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Applistings2Inputs */

const en_developerportal_dashboards_nav_applistings2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Applistings2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Listings`)
};

const es_developerportal_dashboards_nav_applistings2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Applistings2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listados de Apps`)
};

const fr_developerportal_dashboards_nav_applistings2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Applistings2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annonces d'Apps`)
};

const ar_developerportal_dashboards_nav_applistings2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Applistings2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قوائم التطبيقات`)
};

/**
* | output |
* | --- |
* | "App Listings" |
*
* @param {Developerportal_Dashboards_Nav_Applistings2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_applistings2 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Applistings2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Applistings2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_applistings2(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_applistings2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_applistings2(inputs)
	return ar_developerportal_dashboards_nav_applistings2(inputs)
});
export { developerportal_dashboards_nav_applistings2 as "developerPortal.dashboards.nav.appListings" }