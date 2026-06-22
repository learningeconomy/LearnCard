/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs */

const en_developerportal_dashboards_tabs_branding_organizationtagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization tagline`)
};

const es_developerportal_dashboards_tabs_branding_organizationtagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eslogan de la organización`)
};

const fr_developerportal_dashboards_tabs_branding_organizationtagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Slogan de l'organisation`)
};

const ar_developerportal_dashboards_tabs_branding_organizationtagline2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار المؤسسة`)
};

/**
* | output |
* | --- |
* | "Organization tagline" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_organizationtagline2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Organizationtagline2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_organizationtagline2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_organizationtagline2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_organizationtagline2(inputs)
	return ar_developerportal_dashboards_tabs_branding_organizationtagline2(inputs)
});
export { developerportal_dashboards_tabs_branding_organizationtagline2 as "developerPortal.dashboards.tabs.branding.organizationTagline" }