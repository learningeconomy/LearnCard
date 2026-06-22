/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_logoplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/logo.png`)
};

const es_developerportal_dashboards_tabs_embedconfig_logoplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://ejemplo.com/logo.png`)
};

const fr_developerportal_dashboards_tabs_embedconfig_logoplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://exemple.com/logo.png`)
};

const ar_developerportal_dashboards_tabs_embedconfig_logoplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://مثال.com/logo.png`)
};

/**
* | output |
* | --- |
* | "https://example.com/logo.png" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_logoplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Logoplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_logoplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_logoplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_logoplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_logoplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_logoplaceholder3 as "developerPortal.dashboards.tabs.embedConfig.logoPlaceholder" }