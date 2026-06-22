/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Branding1Inputs */

const en_developerportal_dashboards_nav_branding1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Branding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Branding`)
};

const es_developerportal_dashboards_nav_branding1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Branding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marca`)
};

const fr_developerportal_dashboards_nav_branding1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Branding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marque`)
};

const ar_developerportal_dashboards_nav_branding1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Branding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العلامة التجارية`)
};

/**
* | output |
* | --- |
* | "Branding" |
*
* @param {Developerportal_Dashboards_Nav_Branding1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_branding1 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Branding1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Branding1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_branding1(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_branding1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_branding1(inputs)
	return ar_developerportal_dashboards_nav_branding1(inputs)
});
export { developerportal_dashboards_nav_branding1 as "developerPortal.dashboards.nav.branding" }