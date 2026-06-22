/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs */

const en_developerportal_dashboards_tabs_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A brief tagline or description`)
};

const es_developerportal_dashboards_tabs_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un eslogan o descripción breve`)
};

const fr_developerportal_dashboards_tabs_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un slogan ou une brève description`)
};

const ar_developerportal_dashboards_tabs_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار أو وصف مختصر`)
};

/**
* | output |
* | --- |
* | "A brief tagline or description" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_shortbioplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Shortbioplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_shortbioplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_shortbioplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_shortbioplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_branding_shortbioplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_branding_shortbioplaceholder3 as "developerPortal.dashboards.tabs.branding.shortBioPlaceholder" }