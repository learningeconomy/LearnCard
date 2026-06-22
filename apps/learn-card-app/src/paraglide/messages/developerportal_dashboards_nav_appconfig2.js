/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Appconfig2Inputs */

const en_developerportal_dashboards_nav_appconfig2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Appconfig2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Config`)
};

const es_developerportal_dashboards_nav_appconfig2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Appconfig2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Config. de App`)
};

const fr_developerportal_dashboards_nav_appconfig2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Appconfig2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Config. App`)
};

const ar_developerportal_dashboards_nav_appconfig2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Appconfig2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعدادات التطبيق`)
};

/**
* | output |
* | --- |
* | "App Config" |
*
* @param {Developerportal_Dashboards_Nav_Appconfig2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_appconfig2 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Appconfig2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Appconfig2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_appconfig2(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_appconfig2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_appconfig2(inputs)
	return ar_developerportal_dashboards_nav_appconfig2(inputs)
});
export { developerportal_dashboards_nav_appconfig2 as "developerPortal.dashboards.nav.appConfig" }